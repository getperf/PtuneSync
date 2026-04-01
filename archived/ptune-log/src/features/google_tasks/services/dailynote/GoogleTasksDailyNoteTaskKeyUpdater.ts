// src/features/google_tasks/services/dailynote/GoogleTasksDailyNoteTaskKeyUpdater.ts

import { App, TFile } from 'obsidian';
import { DailyNoteLoader } from 'src/core/services/daily_notes/file_io/DailyNoteLoader';
import { DailyNoteTaskKeyExtractor } from 'src/core/services/daily_notes/task_keys/DailyNoteTaskKeyExtractor';
import { DailyNoteTaskKeyWriter } from 'src/core/services/daily_notes/task_keys/DailyNoteTaskKeyWriter';
import { logger } from 'src/core/services/logger/loggerInstance';
import { DailyNoteHelper } from 'src/core/utils/daily_note/DailyNoteHelper';

export interface DailyNoteTaskKeyUpdateResult {
  file: TFile;
  taskKeys: string[];
}

export class GoogleTasksDailyNoteTaskKeyUpdater {
  constructor(private readonly app: App) {}

  /**
   * 今日のデイリーノートから taskKeys を生成し frontmatter を更新
   */
  async execute(
    date: Date = new Date()
  ): Promise<DailyNoteTaskKeyUpdateResult> {
    const path = DailyNoteHelper.resolveDailyNotePath(this.app, date);
    const file = this.app.vault.getAbstractFileByPath(path);

    if (!(file instanceof TFile)) {
      throw new Error('Daily note not found');
    }

    const dailyNote = await DailyNoteLoader.load(this.app, date);
    const lines = dailyNote.plannedTask.getRawLines();
    const extractor = new DailyNoteTaskKeyExtractor();
    const taskKeys = await extractor.extractFromLines(lines);

    const writer = new DailyNoteTaskKeyWriter(this.app);
    await writer.write(file, taskKeys);

    return { file, taskKeys };
  }
}
