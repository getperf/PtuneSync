// File: src/core/services/tasks/TaskKeyGenerator.ts

import { MyTask } from 'src/core/models/tasks/MyTask';

export interface ParsedTask {
  title: string;
  parentTitle?: string;
}

/**
 * TaskKeyGenerator
 * - タスク構造（親子）を ParsedTask として受け取り、一意な taskKey を生成する
 */
export class TaskKeyGenerator {
  private static readonly SEPARATOR = '__';

  static createByTitles(title: string, parentTitle?: string): string {
    return this.createByParsedTask({ title, parentTitle });
  }

  /** ParsedTask → taskKey */
  static createByParsedTask(task: ParsedTask): string {
    const baseKey = this.normalize(task.title);

    if (!task.parentTitle) {
      return baseKey;
    }

    const parentKey = this.normalize(task.parentTitle);
    return `${parentKey}${this.SEPARATOR}${baseKey}`;
  }

  /** タスクタイトル正規化 */
  static normalize(title: string): string {
    return (
      title
        // 🍅x2 などのメタ情報を除外
        .replace(/🍅x?\d*/g, '')
        // チェック用記号などを除外
        .replace(/\[[^\]]*]/g, '')
        // ファイル・ノート禁止文字を除外
        .replace(/[<>:"/\\|?*]/g, '')
        // 空白・区切りを _
        .replace(/[ \t]+/g, '_')
        // 連続 _ を整理
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .trim()
    );
  }
}
