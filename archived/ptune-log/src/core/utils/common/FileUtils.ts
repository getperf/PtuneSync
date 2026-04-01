// File: src/core/utils/common/FileUtils.ts
import { App, TFile } from 'obsidian';
// import { logger } from 'src/core/services/logger/loggerInstance';

export class FileUtils {
  /** 1ファイル全行読み込み */
  static async readLines(app: App, file: TFile): Promise<string[]> {
    const content = await app.vault.read(file);
    return content.split(/\r?\n/);
  }

  /** 行配列からセクション抽出 */
  static extractSection(lines: string[], keyword: string): string[] {
    const isHeading = (l: string) => l.trim().startsWith('#');
    const isRule = (l: string) => /^\s{0,3}(-{3,}|_{3,}|\*{3,})\s*$/.test(l);

    let start = -1;
    for (let i = 0; i < lines.length; i++) {
      if (isHeading(lines[i]) && lines[i].includes(keyword)) {
        start = i + 1;
        break;
      }
    }
    if (start < 0) return [];

    let end = lines.length;
    for (let i = start; i < lines.length; i++) {
      if (isHeading(lines[i]) || isRule(lines[i])) {
        end = i;
        break;
      }
    }
    return lines.slice(start, end);
  }

  /** ファイルから指定セクション抽出 */
  static async readSection(
    app: App,
    file: TFile,
    keyword: string
  ): Promise<string[]> {
    const lines = await FileUtils.readLines(app, file);
    return FileUtils.extractSection(lines, keyword);
  }
}
