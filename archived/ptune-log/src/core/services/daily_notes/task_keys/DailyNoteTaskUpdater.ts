// File: src/core/services/daily_notes/DailyNoteTaskUpdater.ts
import { App, TFile } from 'obsidian';
import { TaskSectionReplacer } from 'src/core/utils/daily_note/TaskSectionReplacer';
import { logger } from 'src/core/services/logger/loggerInstance';

export class DailyNoteTaskUpdater {
  constructor(private readonly app: App) {}

  async replaceTaskListInSection(
    notePath: string,
    heading: string,
    taskMarkdown: string
  ): Promise<boolean> {
    const file = this.app.vault.getAbstractFileByPath(notePath);
    if (!(file instanceof TFile)) return false;

    const original = await this.app.vault.read(file);
    const replacer = new TaskSectionReplacer(heading, taskMarkdown);
    const updated = replacer.replace(original);

    if (original !== updated) {
      await this.app.vault.modify(file, updated);
      logger.info(`[DailyNoteTaskUpdater] Task list replaced in ${notePath}`);
      return true;
    }

    return false;
  }
}
