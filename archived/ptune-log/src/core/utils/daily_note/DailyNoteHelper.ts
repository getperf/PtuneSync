import { App, TFile, normalizePath } from 'obsidian';
import {
  getDailyNoteSettings,
  createDailyNote,
} from 'obsidian-daily-notes-interface';
import { logger } from 'src/core/services/logger/loggerInstance';
import { DateUtil } from 'src/core/utils/date/DateUtil';
import { createAndLogError } from '../errors/errorFactory';

/** --- デイリーノート操作のユーティリティクラス */
export class DailyNoteHelper {
  /** --- 指定日付のノートパスを解決 */
  static resolveDailyNotePath(app: App, date: Date): string {
    const settings = getDailyNoteSettings();
    const dateStr = DateUtil.m(date).format(settings.format);
    const path = normalizePath(`${settings.folder}/${dateStr}.md`);

    logger.debug(`[DailyNoteHelper.resolveDailyNotePath] ${path}`);
    return path;
  }

  /** --- 指定日付のノートを取得。なければ新規作成 */
  static async getOrOpenDailyNoteForDate(app: App, date: Date): Promise<TFile> {
    const path = this.resolveDailyNotePath(app, date);
    const file = app.vault.getAbstractFileByPath(path);

    if (file instanceof TFile) {
      logger.debug(`[DailyNoteHelper.getOrOpenDailyNoteForDate] found ${path}`);
      return file;
    }

    logger.info(`[DailyNoteHelper] creating new daily note for ${path}`);
    const note = await createDailyNote(DateUtil.m(date));
    return note;
  }

  /** --- 指定見出しの下に追記。見出しがなければ末尾に追記 */
  static async appendToSection(
    app: App,
    file: TFile,
    heading: string,
    content: string,
    prepend = false
  ): Promise<void> {
    logger.debug(`[DailyNoteHelper.appendToSection] start heading=${heading}`);

    const vault = app.vault;
    const original = await vault.read(file);
    const lines = original.split('\n');

    // 見出し位置検索
    const insertIndex = lines.findIndex((l) => l.trim() === heading.trim());
    logger.debug(`[DailyNoteHelper] heading found at index=${insertIndex}`);

    const contentLines = content.trim().split('\n');
    let updated: string;

    if (insertIndex >= 0) {
      let insertPos = insertIndex + 1;

      if (!prepend) {
        // 次の同レベル見出しを探索
        for (let i = insertIndex + 1; i < lines.length; i++) {
          if (lines[i].startsWith('## ')) {
            insertPos = i;
            break;
          }
        }
      }

      logger.debug(`[DailyNoteHelper] inserting at line=${insertPos}`);
      const before = lines.slice(0, insertPos);
      const after = lines.slice(insertPos);
      updated = [...before, '', ...contentLines, '', ...after].join('\n');
    } else {
      updated = `${original.trim()}\n\n${heading}\n\n${content.trim()}\n`;
      logger.debug('[DailyNoteHelper] heading not found, appended at end');
    }

    await vault.modify(file, updated);
    logger.info(`[DailyNoteHelper] section updated in ${file.path}`);
  }

  /** --- 指定日付のデイリーノート末尾に追記 */
  static async appendToDailyNote(
    app: App,
    date: Date,
    content: string
  ): Promise<void> {
    const file = await this.getOrOpenDailyNoteForDate(app, date);
    const vault = app.vault;

    const current = await vault.read(file);
    const updated = `${current.trim()}\n\n${content.trim()}\n`;

    logger.debug(`[DailyNoteHelper.appendToDailyNote] appending ${file.path}`);
    await vault.modify(file, updated);
    logger.info(`[DailyNoteHelper] content appended to ${file.path}`);
  }

  /** --- 見出し直後にテキストを挿入（内部用） */
  private static insertAfterHeading(
    content: string,
    heading: string,
    toInsert: string
  ): string {
    const lines = content.split('\n');
    const index = lines.findIndex((line) => line.trim() === heading.trim());
    logger.debug(`[DailyNoteHelper.insertAfterHeading] index=${index}`);

    if (index === -1) {
      logger.debug('[DailyNoteHelper] heading not found, append to end');
      return `${content.trim()}\n\n${toInsert.trim()}\n`;
    }

    const before = lines.slice(0, index + 1);
    const after = lines.slice(index + 1);
    return [...before, '', toInsert.trim(), '', ...after].join('\n');
  }

  /** --- 指定セクションに追記（デイリーノートを自動作成） */
  static async appendToSectionInDailyNote(
    app: App,
    date: Date,
    sectionHeading: string,
    content: string
  ): Promise<void> {
    logger.debug(
      `[DailyNoteHelper.appendToSectionInDailyNote] heading=${sectionHeading}`
    );
    const file = await this.getOrOpenDailyNoteForDate(app, date);
    const vault = app.vault;

    const current = await vault.read(file);
    const updated = this.insertAfterHeading(current, sectionHeading, content);

    await vault.modify(file, updated);
    logger.info(
      `[DailyNoteHelper] section "${sectionHeading}" updated in ${file.path}`
    );
  }

  /**
   * 指定セクションの「末尾」に追記する
   * - 見出し自体は保持
   * - セクション内の最後に追加
   */
  static async appendToEndOfSection(
    app: App,
    note: TFile,
    heading: string,
    text: string
  ): Promise<void> {
    const content = await app.vault.read(note);

    const headingIndex = content.indexOf(heading);
    if (headingIndex === -1) {
      throw createAndLogError(`Heading not found: ${heading}`);
    }

    // 次の同レベル or 上位レベル見出しを探す
    const rest = content.slice(headingIndex + heading.length);
    const match = rest.match(/\n##\s+/);

    const insertPos = match
      ? headingIndex + heading.length + match.index!
      : content.length;

    const updated =
      content.slice(0, insertPos) +
      '\n' +
      text.trim() +
      '\n' +
      content.slice(insertPos);

    await app.vault.modify(note, updated);
  }
}
