// src/core/services/daily_notes/file_io/DailyNoteWriter.ts

import { App, TFile } from 'obsidian';
import { DailyNote } from 'src/core/models/daily_notes/DailyNote';
import { DailyNoteHelper } from 'src/core/utils/daily_note/DailyNoteHelper';
import { FrontmatterHandler } from './FrontmatterHandler';
import { createAndLogError } from 'src/core/utils/errors/errorFactory';

export class DailyNoteWriter {
  constructor(private readonly app: App) {}

  /**
   * DailyNote を指定日のデイリーノートとして保存
   * - 既存 frontmatter は保持
   * - body のみ差し替え
   *
   * @param note 更新後の DailyNote
   * @param date 対象日付
   */
  async write(note: DailyNote, date: Date): Promise<void> {
    const path = DailyNoteHelper.resolveDailyNotePath(this.app, date);
    const file = this.app.vault.getAbstractFileByPath(path);

    if (!(file instanceof TFile)) {
      throw createAndLogError('Daily note not found');
    }

    await this.writeToFile(file, note);
  }

  /**
   * 現在開いているデイリーノートに保存
   * - frontmatter は保持
   * - デイリーノートでない場合は何もしない
   *
   * @param note 更新後の DailyNote
   * @returns true: 保存成功 / false: 対象外
   */
  async writeToActive(note: DailyNote): Promise<boolean> {
    const file = this.app.workspace.getActiveFile();

    if (!file) {
      return false;
    }

    if (!this.isDailyNoteFile(file)) {
      return false;
    }

    await this.writeToFile(file, note);
    return true;
  }

  /**
   * 指定ファイルに DailyNote を保存
   * - frontmatter を保持したまま body を差し替える
   *
   * @param file 書き込み先ファイル
   * @param note 更新後の DailyNote
   */
  private async writeToFile(file: TFile, note: DailyNote): Promise<void> {
    const original = await this.app.vault.read(file);
    const { frontmatter } = FrontmatterHandler.split(original);

    const body = note.toMarkdown();
    const merged = FrontmatterHandler.merge(frontmatter, body);

    await this.app.vault.modify(file, merged);
  }

  /**
   * 簡易的なデイリーノート判定
   *
   * @param file 判定対象ファイル
   * @returns デイリーノートであれば true
   *
   * @remarks
   * - 現在は YYYY-MM-DD.md 形式のみ判定
   * - 将来 DailyNoteHelper に委譲可能
   */
  private isDailyNoteFile(file: TFile): boolean {
    return /^\d{4}-\d{2}-\d{2}\.md$/.test(file.name);
  }
}
