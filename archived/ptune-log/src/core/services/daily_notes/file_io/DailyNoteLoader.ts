// src/core/services/daily_notes/file_io/DailyNoteLoader.ts

import { App } from 'obsidian';
import { DailyNote } from 'src/core/models/daily_notes/DailyNote';
import { DailyNoteReader } from './DailyNoteReader';
import { DailyNoteParser } from '../parse/DailyNoteParser';
import { FrontmatterHandler } from './FrontmatterHandler';

/**
 * DailyNoteLoader
 * - Markdown テキストを DailyNote モデルへ変換する責務を持つ
 * - ファイル選択や UI 依存処理は行わない
 */
export class DailyNoteLoader {
  /**
   * 指定日付のデイリーノートをロードする
   *
   * @param app Obsidian App
   * @param date 対象日付
   * @returns DailyNote モデル
   *
   * @remarks
   * - frontmatter は除外し、body のみを parse 対象とする
   * - ノートが存在しない場合でも空内容の DailyNote を返す設計
   */
  static async load(app: App, date: Date): Promise<DailyNote> {
    const reader = new DailyNoteReader(app);
    const markdown = await reader.readForDate(date);

    const { body } = FrontmatterHandler.split(markdown);
    return DailyNoteParser.parse(body);
  }

  /**
   * 現在開いているデイリーノートをロードする
   *
   * @param app Obsidian App
   * @returns
   * - DailyNote（成功時）
   * - null（アクティブノートが存在しない／デイリーノートでない場合）
   *
   * @remarks
   * - UI 通知は行わない
   * - 呼び出し側で null チェックを必須とする
   */
  static async loadFromActive(app: App): Promise<DailyNote | null> {
    const reader = new DailyNoteReader(app);
    const markdown = await reader.readFromActive();
    if (!markdown) return null;

    const { body } = FrontmatterHandler.split(markdown);
    return DailyNoteParser.parse(body);
  }
}
