import { CreateDailyNoteUseCase } from "../../calendar/usecases/CreateDailyNoteUseCase";
import { CollectCreatedNotesUseCase } from "../../note_scan/usecases/CollectCreatedNotesUseCase";
import { NoteSummaryGenerator } from "../../note_review/services/NoteSummaryGenerator";
import { DailyNotesReflectionBuilder } from "../builders/DailyNotesReflectionBuilder";
import { DailyNotesReflectionDocumentBuilder } from "../builders/DailyNotesReflectionDocumentBuilder";
import { DailyNotesReportBuilder } from "../builders/DailyNotesReportBuilder";
import { buildDailyNotesReflectionPrompt } from "../prompts/buildDailyNotesReflectionPrompt";
import { SentenceSummaryAdapter } from "../services/SentenceSummaryAdapter";
import { ProjectNoteFrontmatterRepository } from "../../../infrastructure/repository/ProjectNoteFrontmatterRepository";
import { CreatedProjectNoteRepository } from "../../../infrastructure/repository/CreatedProjectNoteRepository";
import { DailyNotesReviewWriter } from "../../../infrastructure/document/review/DailyNotesReviewWriter";
import { DailyNoteRepository } from "../../../infrastructure/repository/DailyNoteRepository";
import { DailyNote } from "../../../domain/daily/DailyNote";
import { NoteSummaries } from "../../../domain/note/NoteSummaries";
import { TextGenerationPort } from "../../llm/ports/TextGenerationPort";
import { config } from "../../../config/config";
import { logger } from "../../../shared/logger/loggerInstance";
import { ReviewOutputFormat } from "../../../config/types";
import { ReviewPointXMindTemplateService } from "../../../infrastructure/review/ReviewPointXMindTemplateService";

export type GenerateDailyNotesReviewResult = {
  note?: DailyNote;
  noteCount: number;
  generatedCount: number;
};

export type DailyNotesReviewProgress = {
  type: "targets_resolved" | "summary_generated" | "writing_report";
  total: number;
  completed: number;
  path?: string;
};

export type GenerateDailyNotesReviewOptions = {
  reviewPointOutputFormat?: ReviewOutputFormat;
  enableSummaries?: boolean;
  enableReflection?: boolean;
  onProgress?: (progress: DailyNotesReviewProgress) => void;
};

export class GenerateDailyNotesReviewUseCase {
  constructor(
    private readonly createDailyNoteUseCase: CreateDailyNoteUseCase,
    private readonly dailyNoteRepository: DailyNoteRepository,
    private readonly collectUseCase: CollectCreatedNotesUseCase,
    private readonly createdRepo: CreatedProjectNoteRepository,
    private readonly noteRepo: ProjectNoteFrontmatterRepository,
    private readonly noteSummaryGenerator: NoteSummaryGenerator,
    private readonly textGenerator: TextGenerationPort,
    private readonly writer: DailyNotesReviewWriter,
    private readonly reportBuilder: DailyNotesReportBuilder,
    private readonly reviewPointXMindTemplateService?: ReviewPointXMindTemplateService,
    private readonly reflectionDocumentBuilder = new DailyNotesReflectionDocumentBuilder(),
    private readonly reflectionBuilder = new DailyNotesReflectionBuilder(),
  ) {}

  async execute(
    date: string,
    options?: GenerateDailyNotesReviewOptions,
  ): Promise<GenerateDailyNotesReviewResult> {
    logger.debug(`[UseCase:start] GenerateDailyNotesReviewUseCase date=${date}`);

    try {
      const files = this.createdRepo.findByDate(date);
      logger.debug(`[UseCase] GenerateDailyNotesReviewUseCase targets date=${date} count=${files.length}`);
      options?.onProgress?.({
        type: "targets_resolved",
        total: files.length,
        completed: 0,
      });

      let generatedCount = 0;

      const enableSummaries = options?.enableSummaries ?? true;

      if (enableSummaries) {
        for (const file of files) {
          if (await this.createdRepo.hasSummary(file)) {
            continue;
          }

          const summary = await this.noteSummaryGenerator.generate(file);
          await this.noteRepo.saveSummary(file, summary);
          generatedCount += 1;
          options?.onProgress?.({
            type: "summary_generated",
            total: files.length,
            completed: generatedCount,
            path: file.path,
          });
        }
      }

      const summaries = await this.collectUseCase.execute(date);

      if (summaries.getAll().length === 0) {
        logger.debug(`[UseCase:end] GenerateDailyNotesReviewUseCase date=${date} notes=0 generated=${generatedCount}`);
        return {
          note: undefined,
          noteCount: 0,
          generatedCount,
        };
      }

      const report = this.reportBuilder.build(summaries, {
        includeSummaries: enableSummaries,
      });
      options?.onProgress?.({
        type: "writing_report",
        total: summaries.getAll().length,
        completed: generatedCount,
      });
      const { note } = await this.createDailyNoteUseCase.execute(date);
      const reflection = (options?.enableReflection ?? true)
        ? await this.buildReflection(
            summaries,
            note,
            options?.reviewPointOutputFormat ?? config.settings.review.reviewPointOutputFormat,
          )
        : "";
      const updated = this.writer.write(note, report, reflection);
      await this.dailyNoteRepository.save(updated);

      logger.debug(`[UseCase:end] GenerateDailyNotesReviewUseCase date=${date} notes=${summaries.getAll().length} generated=${generatedCount}`);

      return {
        note: updated,
        noteCount: summaries.getAll().length,
        generatedCount,
      };
    } catch (error) {
      logger.warn(
        `[UseCase] GenerateDailyNotesReviewUseCase failed date=${date} message=${this.resolveErrorMessage(error)}`,
        error,
      );
      throw error;
    }
  }

  private async buildReflection(
    summaries: NoteSummaries,
    note: DailyNote,
    outputFormat: ReviewOutputFormat,
  ): Promise<string> {
    const doc = this.reflectionDocumentBuilder.build(summaries);
    let xmindFileLink: string | undefined;

    if (outputFormat === "xmind" && this.reviewPointXMindTemplateService) {
      const xmindFile = await this.reviewPointXMindTemplateService.ensureForDailyNote(note);
      xmindFileLink = xmindFile.markdownLinkPath;
    }

    if (config.settings.review.sentenceMode !== "llm") {
      return this.reflectionBuilder.build(doc, outputFormat, { xmindFileLink });
    }

    const adapter = new SentenceSummaryAdapter(doc);
    const sentenceInputs = adapter.extract();
    logger.debug(
      `[UseCase] GenerateDailyNotesReviewUseCase reflectionSentences=${sentenceInputs.length}`,
    );

    if (sentenceInputs.length === 0) {
      return this.reflectionBuilder.build(doc, outputFormat, { xmindFileLink });
    }

    const reflection = await this.textGenerator.generate(
      buildDailyNotesReflectionPrompt(),
      JSON.stringify(sentenceInputs, null, 2),
    );

    if (reflection?.trim()) {
      logger.debug(
        `[UseCase] GenerateDailyNotesReviewUseCase reflectionResponse chars=${reflection.length}`,
      );
      adapter.apply(reflection);
    } else {
      logger.warn("[UseCase] GenerateDailyNotesReviewUseCase reflectionResponse empty");
    }

    return this.reflectionBuilder.build(doc, outputFormat, { xmindFileLink });
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
}
