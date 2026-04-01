import { App, TFile } from 'obsidian';
import { logger } from 'src/core/services/logger/loggerInstance';
import { NoteFrontmatterParser } from 'src/core/utils/frontmatter/NoteFrontmatterParser';
import { NoteSummary } from 'src/core/models/notes/NoteSummary';
import { DateUtil } from 'src/core/utils/date/DateUtil';

/**
 * --- NoteFinder
 * Vault 内のノートを frontmatter または作成日・ファイル名プレフィックスで検索するユーティリティ。
 */
export class NoteFinder {
  constructor(private readonly app: App) { }

  /**
   * --- 指定日付に一致するノートを検索
   * - frontmatter.createdAt または dailynote を用いてマッチ
   */
  async findNotesByDate(targetDate: Date): Promise<NoteSummary[]> {
    const files = this.app.vault.getMarkdownFiles();
    const results: NoteSummary[] = [];
    const targetKey = DateUtil.dateKey(targetDate);

    for (const file of files) {
      const summary = await this._extractNoteSummaryIfValid(file, false);
      if (!summary) continue;

      const noteDateKey = summary.dailynote
        ? DateUtil.extractDateKeyFromLink(summary.dailynote)
        : DateUtil.dateKey(summary.createdAt);

      if (noteDateKey === targetKey) {
        results.push(summary);
        logger.debug(`[NoteFinder.findNotesByDate] matched: ${file.path}`);
      }
    }

    logger.info(`[NoteFinder.findNotesByDate] matched=${results.length}`);
    return results;
  }

  /**
   * --- 指定フォルダ内の記録ノートを検索
   * - フォルダ配下の Markdown ファイルのうち、数字プレフィックス付きファイルを対象に抽出
   */
  async findNotesByFolder(folderPath: string): Promise<NoteSummary[]> {
    const files = this.app.vault.getMarkdownFiles();
    const results: NoteSummary[] = [];

    for (const file of files) {
      if (!file.path.startsWith(folderPath + '/')) continue;

      const summary = await this._extractNoteSummaryIfValid(file, true);
      if (summary) results.push(summary);
    }

    logger.debug(
      `[NoteFinder.findNotesByFolder] matched=${results.length} in ${folderPath}`
    );
    return results;
  }

  /**
   * --- _extractNoteSummaryIfValid
   * フロントマター解析とプレフィックス判定を行い、条件に合致する場合のみ NoteSummary を返す
   * @param file 対象ファイル
   * @param requirePrefix true の場合は「数字で始まるファイル名」のみ許容
   */
  private async _extractNoteSummaryIfValid(
    file: TFile,
    requirePrefix: boolean
  ): Promise<NoteSummary | null> {
    const fileName = file.name;

    const excludedNames = ['snippet.md', 'template.md'];
    if (excludedNames.includes(fileName)) return null;

    if (requirePrefix && !/^\d+_/.test(fileName)) {
      logger.debug(`[NoteFinder] skipped by prefix: ${file.path}`);
      return null;
    }

    const text = await this.app.vault.cachedRead(file);
    const fm = NoteFrontmatterParser.parse(text);

    const createdAt = fm.createdAt
      ? new Date(fm.createdAt)
      : new Date(file.stat.ctime);

    const dailynoteLink = fm.dailynote ?? undefined;
    const goal = fm.goal ?? undefined;

    if (!createdAt && !dailynoteLink) return null;

    const summary = NoteSummary.fromFileData(file, {
      summary: fm.summary,
      tags: fm.tags,
      createdAt,
      dailynote: dailynoteLink,
      taskKey: fm.taskKey,
      goal, // ← 渡す
    });

    return summary;
  }
}
