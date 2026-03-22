// src/infrastructure/repository/DailyNoteRepository.ts

import { App, moment, TFile } from "obsidian";
import { createDailyNote } from "obsidian-daily-notes-interface";
import { PtuneRuntime } from "../../shared/PtuneRuntime";
import { DailyNote } from "../../domain/daily/DailyNote";
import { logger } from "../../shared/logger/loggerInstance";

export class DailyNoteRepository {
  constructor(
    private readonly runtime: PtuneRuntime,
    private readonly app: App,
  ) { }

  async getActive(): Promise<DailyNote> {
    logger.debug("DailyNoteRepository.getActive started");

    const file = this.app.workspace.getActiveFile();
    if (!file) {
      logger.warn("getActive: No active file");
      throw new Error("No active file.");
    }

    const date = this.runtime.parseDailyNoteDate(file.path);

    if (!date) {
      logger.warn(`getActive: Not a DailyNote file (${file.path})`);
      throw new Error("Active file is not a DailyNote.");
    }

    const content = await this.app.vault.read(file);
    logger.debug(`getActive: resolved date=${date}`);

    return new DailyNote(date, file.path, content);
  }

  async listExistingDates(): Promise<string[]> {
    const dir = this.runtime.resolveJournalDir();
    logger.debug(`listExistingDates: dir=${dir}`);

    const dates = this.app.vault.getMarkdownFiles()
      .filter((file) => !dir || file.path.startsWith(`${dir}/`) || file.path === `${dir}.md`)
      .map((file) => this.runtime.parseDailyNoteDate(file.path))
      .filter((date): date is string => date !== null);

    logger.debug(`listExistingDates: found ${dates.length} notes`);

    return dates;
  }

  async findByDate(date: string): Promise<DailyNote | null> {
    const notePath = this.runtime.resolveNoteUri(date);

    logger.debug(`findByDate: ${notePath}`);

    try {
      const content = await this.app.vault.adapter.read(notePath);
      logger.debug(`findByDate: loaded (${date})`);
      return new DailyNote(date, notePath, content);
    } catch {
      logger.debug(`findByDate: not found (${date})`);
      return null;
    }
  }

  async save(note: DailyNote): Promise<void> {
    logger.debug(`save: ${note.filePath}`);

    try {
      const existing = this.app.vault.getAbstractFileByPath(note.filePath);

      if (existing instanceof TFile) {
        await this.app.vault.modify(existing, note.content);
      } else {
        const created = await createDailyNote(
          moment(note.date, "YYYY-MM-DD", true),
        );

        if (note.filePath !== created.path) {
          logger.debug(`save: created resolved path ${created.path}`);
        }

        await this.app.vault.modify(created, note.content);
      }

      logger.info(`save: completed (${note.filePath})`);
    } catch (error) {
      logger.error(`save failed (${note.filePath})`, error);
      throw error;
    }
  }
}
