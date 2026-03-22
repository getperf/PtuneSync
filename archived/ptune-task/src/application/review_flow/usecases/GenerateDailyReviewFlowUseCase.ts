import { logger } from "../../../shared/logger/loggerInstance";
import { CreateDailyNoteUseCase } from "../../calendar/usecases/CreateDailyNoteUseCase";
import {
  GenerateDailyNotesReviewUseCase,
  GenerateDailyNotesReviewOptions,
} from "../../daily_notes_review/usecases/GenerateDailyNotesReviewUseCase";
import { TextGenerationPort } from "../../llm/ports/TextGenerationPort";
import { GenerateDailyReviewUseCase } from "../../review/usecases/GenerateDailyReviewUseCase";
import { getDefaultTaskListId } from "../../sync/shared/DefaultTaskListId";
import { DailyReviewFlowProgressEvent } from "../types/DailyReviewFlowProgressEvent";
import { DailyReviewFlowResult } from "../types/DailyReviewFlowResult";
import { ReviewFlowRunOptions } from "../types/ReviewFlowRunOptions";

export class GenerateDailyReviewFlowUseCase {
  constructor(
    private readonly taskReviewUseCase: GenerateDailyReviewUseCase,
    private readonly dailyNotesReviewUseCase: GenerateDailyNotesReviewUseCase,
    private readonly createDailyNoteUseCase: CreateDailyNoteUseCase,
    private readonly textGenerator: TextGenerationPort,
  ) {}

  async execute(
    options: ReviewFlowRunOptions,
    onProgress?: (event: DailyReviewFlowProgressEvent) => void,
  ): Promise<DailyReviewFlowResult> {
    logger.debug(`[UseCase:start] GenerateDailyReviewFlowUseCase date=${options.date}`);

    try {
      onProgress?.({ type: "started", date: options.date });
      logger.debug(`[UseCase] GenerateDailyReviewFlowUseCase options date=${options.date} taskReviewEnabled=${options.taskReviewEnabled} notesReviewEnabled=${options.dailyNotesReviewEnabled} reviewPointFormat=${options.reviewPointOutputFormat}`);

      let taskReviewResult: Awaited<ReturnType<GenerateDailyReviewUseCase["execute"]>> | null = null;

      if (options.taskReviewEnabled) {
        onProgress?.({ type: "task_review_started", date: options.date });
        taskReviewResult = await this.taskReviewUseCase.execute(
          options.date,
          getDefaultTaskListId(),
        );
        onProgress?.({
          type: "task_review_completed",
          taskCount: taskReviewResult.taskCount,
        });
      } else {
        onProgress?.({ type: "task_review_skipped" });
      }

      if (!options.dailyNotesReviewEnabled) {
        onProgress?.({ type: "daily_notes_review_skipped", reason: "disabled" });
        logger.debug(
          `[UseCase:end] GenerateDailyReviewFlowUseCase date=${options.date} taskCount=${taskReviewResult?.taskCount ?? 0} notesReview=skipped reason=disabled`,
        );

        return {
          note: taskReviewResult?.note ?? (await this.resolveDailyNote(options.date)),
          taskReview: taskReviewResult
            ? {
                executed: true,
                taskCount: taskReviewResult.taskCount,
              }
            : {
                executed: false,
                taskCount: 0,
              },
          dailyNotesReview: {
            executed: false,
            noteCount: 0,
            generatedCount: 0,
            skippedReason: "disabled",
          },
        };
      }

      let targetCount = 0;
      const llmAvailable = this.textGenerator.hasValidApiKey();
      const dailyNotesReviewOptions: GenerateDailyNotesReviewOptions = {
        reviewPointOutputFormat: options.reviewPointOutputFormat,
        enableSummaries: llmAvailable,
        enableReflection: llmAvailable,
        onProgress: (progress) => {
          if (progress.type === "targets_resolved") {
            targetCount = progress.total;
            onProgress?.({
              type: "daily_notes_review_started",
              date: options.date,
              targetCount,
            });
            return;
          }

          onProgress?.({
            type: "daily_notes_review_progress",
            completed: progress.completed,
            total: progress.total,
            path: progress.path ?? "",
          });
        },
      };
      const dailyNotesReviewResult = await this.dailyNotesReviewUseCase.execute(
        options.date,
        dailyNotesReviewOptions,
      );
      onProgress?.({
        type: "daily_notes_review_completed",
        noteCount: dailyNotesReviewResult.noteCount,
        generatedCount: dailyNotesReviewResult.generatedCount,
      });

      logger.debug(
        `[UseCase:end] GenerateDailyReviewFlowUseCase date=${options.date} taskCount=${taskReviewResult?.taskCount ?? 0} noteCount=${dailyNotesReviewResult.noteCount} generated=${dailyNotesReviewResult.generatedCount}`,
      );
      onProgress?.({ type: "completed" });

      return {
        note: dailyNotesReviewResult.note ?? taskReviewResult?.note ?? (await this.resolveDailyNote(options.date)),
        taskReview: taskReviewResult
          ? {
              executed: true,
              taskCount: taskReviewResult.taskCount,
            }
          : {
              executed: false,
              taskCount: 0,
            },
        dailyNotesReview: {
          executed: true,
          noteCount: dailyNotesReviewResult.noteCount,
          generatedCount: dailyNotesReviewResult.generatedCount,
        },
      };
    } catch (error) {
      onProgress?.({
        type: "failed",
        message: this.resolveErrorMessage(error),
      });
      logger.warn(
        `[UseCase] GenerateDailyReviewFlowUseCase failed date=${options.date} message=${this.resolveErrorMessage(error)}`,
        error,
      );
      throw error;
    }
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === "string") {
      return error;
    }

    return "unknown";
  }

  private async resolveDailyNote(date: string) {
    const { note } = await this.createDailyNoteUseCase.execute(date);
    return note;
  }
}
