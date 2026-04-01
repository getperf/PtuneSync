// File: src/core/services/notes/DailyNoteTaskKeyWriter.ts

import { App, TFile } from 'obsidian';

export class DailyNoteTaskKeyWriter {
  constructor(private readonly app: App) {}

  async write(file: TFile, taskKeys: string[]): Promise<void> {
    const cache = this.app.metadataCache.getFileCache(file);
    const frontmatter = cache?.frontmatter ?? {};

    const updated = {
      ...frontmatter,
      taskKeys,
    };

    await this.app.fileManager.processFrontMatter(file, (fm) => {
      // 全量上書き
      fm.taskKeys = [...taskKeys];
    });
  }
}
