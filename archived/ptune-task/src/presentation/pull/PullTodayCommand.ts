// src/application/commands/PullTodayCommand.ts

import { PullAndMergeTodayUseCase } from "../../application/sync/pull/PullAndMergeTodayUseCase";
import { DailyNote } from "../../domain/daily/DailyNote";
import { logger } from "../../shared/logger/loggerInstance";

export interface PullTodayPresenter {
  openNote(note: DailyNote): Promise<void>;
  refreshCalendar(): Promise<void>;
  showInfo(message: string): void;
  showError(message: string): void;
  saveActiveEditor(): Promise<void>;
}

export class PullTodayCommand {
  constructor(
    private readonly useCase: PullAndMergeTodayUseCase,
    private readonly presenter: PullTodayPresenter,
  ) {}

  async execute(): Promise<void> {
    logger.debug("[Command:start] PullTodayCommand");
    try {
      await this.presenter.saveActiveEditor();
      const result = await this.useCase.execute();

      await this.presenter.openNote(result.note);
      await this.presenter.refreshCalendar();

      this.presenter.showInfo(
        result.created ? "Daily note created and pulled." : "Pull completed.",
      );
      logger.debug(`[Command:end] PullTodayCommand created=${result.created} path=${result.note.filePath}`);
    } catch (err) {
      logger.error("[Command] PullTodayCommand failed", err);
      this.presenter.showError(String(err));
    }
  }
}
