import { App, TFolder } from 'obsidian';
import { NoteSummaries } from 'src/core/models/notes/NoteSummaries';
import { logger } from '../logger/loggerInstance';
import { NoteFinder } from 'src/core/utils/note/NoteFinder';

/**
 * --- NoteSummaryLoader
 * 指定TFolder配下のMarkdownノートを走査し、
 * NoteSummary群（NoteSummaries）を生成するローダクラス。
 */
export class NoteSummaryLoader {
  constructor(private readonly app: App) { }

  /**
   * --- loadFromFolder
   * 指定フォルダ配下の .md ファイルを走査して NoteSummaries を生成。
   */
  async loadProjectFolder(folder: TFolder): Promise<NoteSummaries> {
    const finder = new NoteFinder(this.app);
    const summaries = new NoteSummaries();
    const matched = await finder.findNotesByFolder(folder.path);
    for (const summary of matched) summaries.add(summary);
    return summaries;
  }

  /**
   * --- debugPrintSummaries
   * NoteSummaries に含まれるノート一覧を簡易出力。
   * 主にデバッグ目的でロード内容を確認する用途。
   */
  static debugPrintSummaries(summaries: NoteSummaries): void {
    const notes = summaries.getAll();
    logger.debug(
      `[NoteSummaryLoader.debugPrintSummaries] === ロード結果一覧 (${notes.length}) ===`
    );
    for (const note of notes) {
      logger.debug(`- ${note.notePath} (${note.createdAt.toISOString()})`);
    }
  }
}
