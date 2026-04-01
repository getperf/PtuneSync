// src/core/services/daily_notes/file_io/DailyNoteReader.ts

import { App, TFile } from 'obsidian';
import { DailyNoteHelper } from '../../../utils/daily_note/DailyNoteHelper';

/**
 * DailyNoteReader
 * - デイリーノートの Markdown 生テキストを取得する責務を持つ
 * - モデル化（parse）や UI 通知は行わない
 */
export class DailyNoteReader {
  constructor(private readonly app: App) {}

  /**
   * 指定日付のデイリーノートを取得する
   *
   * @param date 対象日付
   * @returns frontmatter を含む Markdown テキスト（存在しない場合は空文字）
   *
   * @remarks
   * - デイリーノートが存在しない場合は新規作成／オープンを試みる
   * - 取得できなかった場合は例外を投げず、空文字を返す
   */
  async readForDate(date: Date): Promise<string> {
    const note = await DailyNoteHelper.getOrOpenDailyNoteForDate(
      this.app,
      date
    );
    if (!note) return '';

    const raw = await this.app.vault.read(note);
    return this.normalize(raw);
  }

  /**
   * 現在アクティブなデイリーノートを取得する
   *
   * @returns
   * - Markdown テキスト（成功時）
   * - null（以下のいずれかの場合）
   *   - アクティブなファイルが存在しない
   *   - アクティブファイルがデイリーノートではない
   *
   * @remarks
   * - UI 通知（Notice）は行わない
   * - 呼び出し側（UseCase / Feature）でユーザ通知を行う前提
   */
  async readFromActive(): Promise<string | null> {
    const file = this.app.workspace.getActiveFile();
    if (!file) {
      return null;
    }

    if (!this.isDailyNoteFile(file)) {
      return null;
    }

    const raw = await this.app.vault.read(file);
    return this.normalize(raw);
  }

  /**
   * 改行コードを LF に正規化する
   *
   * @param raw 生 Markdown
   * @returns 改行正規化済み Markdown
   *
   * @remarks
   * - Windows / macOS / Linux の差異を吸収する
   */
  private normalize(raw: string): string {
    return raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }

  /**
   * 対象ファイルがデイリーノートかどうかを判定する
   *
   * @param file 判定対象ファイル
   * @returns デイリーノートであれば true
   *
   * @remarks
   * - 現在はファイル名（YYYY-MM-DD.md）による最小判定
   * - 将来、DailyNoteHelper に委譲する余地あり
   */
  private isDailyNoteFile(file: TFile): boolean {
    return /^\d{4}-\d{2}-\d{2}\.md$/.test(file.name);
  }
}
