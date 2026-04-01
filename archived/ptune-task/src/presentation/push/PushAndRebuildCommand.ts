// src/presentation/push/PushAndRebuildCommand.ts

import { DailyNote } from "../../domain/daily/DailyNote";
import { logger } from "../../shared/logger/loggerInstance";
import { DiffResult } from "../../application/sync/shared/dto/DiffResult";
import { SyncAndRebuildDailyNoteUseCase } from "../../application/rebuild/SyncAndRebuildDailyNoteUseCase";
import { PushSyncUseCase } from "../../application/sync/push/PushSyncUseCase";
import { PushPresenter } from "./PushPresenter";
import { TodayResolver } from "../../application/calendar/services/TodayResolver";
import { DailyNoteRepository } from "../../infrastructure/repository/DailyNoteRepository";
import { DailyNoteDocumentAdapter } from "../../infrastructure/document/adapter/DailyNoteDocumentAdapter";
import { SyncPhase } from "../../domain/task/SyncPhase";

export class PushAndRebuildCommand {
  constructor(
    private readonly todayResolver: TodayResolver,
    private readonly repository: DailyNoteRepository,
    private readonly syncUseCase: PushSyncUseCase,
    private readonly rebuildUseCase: SyncAndRebuildDailyNoteUseCase,
    private readonly presenter: PushPresenter,
  ) { }

  async execute(): Promise<void> {
    logger.debug("[Command:start] PushAndRebuildCommand");

    try {
      await this.presenter.saveActiveEditor();

      // 前処理チェック
      const todayNote = await this.getTodayNote();

      await this.verifyTodayNoteIsActive(todayNote);

      const adapter = new DailyNoteDocumentAdapter(todayNote.content);

      const phase = adapter.getSyncPhase() ?? SyncPhase.Planning;

      const allowDelete =
        phase === SyncPhase.Planning;
      logger.debug(`[Command] PushAndRebuildCommand phase=${phase} allowDelete=${allowDelete}`);

      const result =
        await this.syncUseCase.execute(phase, allowDelete);

      if (result === false) {
        this.presenter.showInfo("Push cancelled.");
        return;
      }

      if (result instanceof Object && "success" in result) {
        const diff = result as DiffResult;

        if (diff.isValidationFailure()) {
          const message = `Diff validation failed (${diff.summary.errors} errors)`;
          const details = this.buildValidationMessage(diff);
          this.presenter.showWarningWithDetails(message, details);
          return;
        }
      }

      const updated = await this.rebuildUseCase.execute();

      await this.presenter.openNote(updated);
      await this.presenter.refreshCalendar();

      this.presenter.showInfo("Push and rebuild completed.");
      logger.debug(`[Command:end] PushAndRebuildCommand path=${updated.filePath}`);
    } catch (err) {
      logger.error("[Command] PushAndRebuildCommand failed", err);
      this.presenter.showError(String(err));
    }
  }

  /**
   * 今日のノート取得
   */
  private async getTodayNote(): Promise<DailyNote> {

    const today = this.todayResolver.resolve();
    logger.debug(`[Command] PushAndRebuildCommand resolvedToday=${today}`);

    const note = await this.repository.findByDate(today);

    if (!note) {
      throw new Error("Today's daily note does not exist. Run Pull first.");
    }

    return note;
  }

  /**
   * active editor が today note か確認
   */
  private async verifyTodayNoteIsActive(todayNote: DailyNote): Promise<void> {
    const active = await this.repository.getActive();

    if (active.date !== todayNote.date) {
      throw new Error("Open today's daily note before executing push.");
    }
  }

  private buildValidationMessage(diff: DiffResult): string {
    const summaries = [
      `create: ${diff.summary.create}`,
      `update: ${diff.summary.update}`,
      `delete: ${diff.summary.delete}`,
      `errors: ${diff.summary.errors}`,
      `warnings: ${diff.summary.warnings}`,
    ];

    const lines = ["=== Summary ===", summaries.join(" / "), ""];

    if (diff.errors.length > 0) {
      lines.push("=== Errors ===", ...diff.errors, "");
    }

    if (diff.warnings.length > 0) {
      lines.push("=== Warnings ===", ...diff.warnings);
    }

    return lines.join("\n");
  }
}
