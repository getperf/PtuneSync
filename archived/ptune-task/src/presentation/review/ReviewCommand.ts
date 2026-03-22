import { App } from "obsidian";
import { TodayResolver } from "../../application/calendar/services/TodayResolver";
import { DailyReviewFlowProgressEvent } from "../../application/review_flow/types/DailyReviewFlowProgressEvent";
import { DailyReviewFlowResult } from "../../application/review_flow/types/DailyReviewFlowResult";
import { ReviewFlowDialogOptions } from "../../application/review_flow/types/ReviewFlowDialogOptions";
import { ReviewFlowRunOptions } from "../../application/review_flow/types/ReviewFlowRunOptions";
import { GenerateDailyReviewFlowUseCase } from "../../application/review_flow/usecases/GenerateDailyReviewFlowUseCase";
import { ReviewFlowOptionsResolver } from "../../application/review_flow/services/ReviewFlowOptionsResolver";
import { logger } from "../../shared/logger/loggerInstance";
import { DailyNote } from "../../domain/daily/DailyNote";
import { ReviewProgressController } from "./ReviewProgressController";
import { ReviewSetupModal } from "./ReviewSetupModal";

export interface ReviewPresenter {
  readonly app: App;
  openNote(note: DailyNote): Promise<void>;
  refreshCalendar(): Promise<void>;
  showInfo(message: string): void;
  showError(message: string): void;
  saveActiveEditor(): Promise<void>;
}

export class ReviewCommand {
  constructor(
    private readonly todayResolver: TodayResolver,
    private readonly optionsResolver: ReviewFlowOptionsResolver,
    private readonly useCase: GenerateDailyReviewFlowUseCase,
    private readonly presenter: ReviewPresenter,
  ) {}

  execute(): void {
    const today = this.todayResolver.resolve();
    const defaults = this.optionsResolver.resolve();
    const dialogOptions: ReviewFlowDialogOptions = {
      date: today,
      dateCandidates: this.buildRecentDates(today, 7),
      taskReviewEnabled: defaults.taskReviewEnabledDefault,
      dailyNotesReviewEnabled: defaults.notesReviewEnabledDefault,
      reviewPointOutputFormat: defaults.reviewPointOutputFormat,
    };

    new ReviewSetupModal(
      this.presenter.app,
      dialogOptions,
      async (options) => {
        await this.run(options);
      },
    ).open();
  }

  private async run(options: ReviewFlowRunOptions): Promise<void> {
    logger.info(`[Command] ReviewCommand started date=${options.date}`);
    const progress = new ReviewProgressController(this.presenter.app, options.date);
    progress.open();

    try {
      await this.presenter.saveActiveEditor();

      const result = await this.useCase.execute(
        options,
        (event: DailyReviewFlowProgressEvent) => {
          progress.handleEvent(event);
        },
      );

      await this.presenter.openNote(result.note);
      await this.presenter.refreshCalendar();

      progress.markCompleted();
      this.presenter.showInfo(this.buildMessage(result));

      logger.info(`[Command] ReviewCommand completed date=${options.date}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      progress.markFailed(message);
      logger.error(`[Command] ReviewCommand failed date=${options.date}`, err);
    }
  }

  private buildMessage(result: DailyReviewFlowResult): string {
    if (!result.dailyNotesReview.executed) {
      return `Review generated (${result.taskReview.taskCount} tasks, notes review skipped: ${result.dailyNotesReview.skippedReason})`;
    }

    return `Review generated (${result.taskReview.taskCount} tasks, notes ${result.dailyNotesReview.noteCount}/${result.dailyNotesReview.generatedCount})`;
  }

  private buildRecentDates(today: string, days: number): string[] {
    const result: string[] = [];
    const base = new Date(`${today}T12:00:00`);

    for (let i = 0; i < days; i += 1) {
      const value = new Date(base);
      value.setDate(base.getDate() - i);
      result.push(this.formatDate(value));
    }

    return result;
  }

  private formatDate(date: Date): string {
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}
