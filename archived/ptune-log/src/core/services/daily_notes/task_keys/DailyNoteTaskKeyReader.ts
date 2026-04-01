// File: src/core/services/notes/DailyNoteTaskKeyReader.ts

import { App, TFile } from 'obsidian';
import { ExportTask } from 'src/core/models/tasks/ExportTasks';
import { DailyNoteHelper } from 'src/core/utils/daily_note/DailyNoteHelper';

export class DailyNoteTaskKeyReader {
  /**
   * 指定日のデイリーノート frontmatter.taskKeys を読み取り
   * UI 選択用の ExportTask[] を生成する
   *
   * @param app Obsidian App
   * @param date 対象日（省略時は今日）
   */
  static async read(app: App, date: Date = new Date()): Promise<ExportTask[]> {
    const path = DailyNoteHelper.resolveDailyNotePath(app, date);
    const file = app.vault.getAbstractFileByPath(path);

    if (!(file instanceof TFile)) {
      return [];
    }

    const cache = app.metadataCache.getFileCache(file);
    const taskKeys: string[] = cache?.frontmatter?.taskKeys ?? [];

    if (!Array.isArray(taskKeys) || taskKeys.length === 0) {
      return [];
    }

    return this.buildExportTasks(taskKeys);
  }

  /**
   * taskKey 配列から ExportTask[]（階層構造）を生成
   * - 並び順は frontmatter.taskKeys に依存
   * - 親子判定は prefix 規約
   */
  // File: src/core/services/notes/DailyNoteTaskKeyReader.ts

  private static buildExportTasks(taskKeys: string[]): ExportTask[] {
    const result: ExportTask[] = [];
    let currentParentKey: string | null = null;

    for (const key of taskKeys) {
      const parts = key.split('__');

      // 親タスク
      if (parts.length === 1) {
        result.push({
          taskKey: key,
          title: key,
          fullTitle: key,
        });
        currentParentKey = key;
        continue;
      }

      // 子タスク
      const leaf = parts[parts.length - 1];
      const parentKey = parts.slice(0, -1).join('_');

      if (currentParentKey && currentParentKey === parentKey) {
        result.push({
          taskKey: key,
          title: `　${leaf}`, // 表示用インデント
          fullTitle: `${parentKey}/${leaf}`,
          parentTitle: parentKey,
        });
      } else {
        // フォールバック（親不整合）
        result.push({
          taskKey: key,
          title: key,
          fullTitle: key,
        });
        currentParentKey = null;
      }
    }

    return result;
  }
}
