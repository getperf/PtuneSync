// File: src/core/services/llm/note_analysis/NoteAnalysisRunner.ts
import { App, Notice, TFile, TFolder } from 'obsidian';
import { TagAliases } from 'src/core/models/tags/TagAliases';
import { logger } from 'src/core/services/logger/loggerInstance';
import { NoteSummaries } from 'src/core/models/notes/NoteSummaries';
import { NoteAnalysisProcessor } from './NoteAnalysisProcessor';
import { NoteSearchService } from 'src/core/services/notes/NoteSearchService';
import { IProgressReporter } from './IProgressReporter';
import { TagYamlIO } from 'src/core/services/yaml/TagYamlIO';
import { UnregisteredTagService } from 'src/core/services/tags/UnregisteredTagService';

/**
 * LLM による複数ノート解析の統括クラス。
 *
 * 責務:
 * - ノート検索（date / folder）
 * - 複数ノートの逐次処理
 * - 進捗通知（IProgressReporter）
 *
 * 非責務:
 * - プロンプト生成
 * - タグランキング計算
 */
export class NoteAnalysisRunner {
  private readonly noteSearch: NoteSearchService;

  constructor(
    private readonly app: App,
    private readonly processor: NoteAnalysisProcessor
  ) {
    this.noteSearch = new NoteSearchService(app);
  }

  /** 指定日付のノート取得 */
  async findFilesByDate(date: Date): Promise<TFile[]> {
    return await this.noteSearch.findByDate(date);
  }

  /** 指定フォルダ配下のノート取得 */
  findFilesInFolder(folder: TFolder): TFile[] {
    return this.noteSearch.findInFolder(folder);
  }

  /**
   * runOnFiles
   * - 完成済み prompt を用いてノートを解析する
   * - UI 依存部分（進行表示）は IProgressReporter に委譲
   */
  async runOnFiles(
    files: TFile[],
    prompt: string,
    reporter?: IProgressReporter,
    force = false
  ): Promise<NoteSummaries> {
    logger.debug(
      `[NoteAnalysisRunner.runOnFiles] start total=${files.length} force=${force}`
    );

    // --- 対象ファイルなし
    if (files.length === 0) {
      logger.warn('[NoteAnalysisRunner] no files found');
      new Notice('対象ノートが見つかりません。');
      return new NoteSummaries();
    }

    // --- Reporter に開始通知
    reporter?.onStart(files.length);

    // --- タグエイリアス（1回だけロード）
    const aliases = new TagAliases();
    await aliases.load(this.app.vault);
    logger.debug('[NoteAnalysisRunner] TagAliases loaded');

    const summaries = new NoteSummaries();
    let errorCount = 0;

    // --- ファイル逐次処理
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // UI側へ進捗を通知
      reporter?.onProgress(i, file);

      try {
        logger.debug(
          `[NoteAnalysisRunner] processing file=${file.path} index=${i}`
        );

        const summary = await this.processor.process(
          file,
          prompt,
          aliases,
          force
        );
        summaries.add(summary);

        logger.debug(
          `[NoteAnalysisRunner] processed: ${file.path} (index ${i})`
        );
      } catch (e) {
        logger.error(`[NoteAnalysisRunner] error in ${file.path}`, e);
        errorCount++;
      }
    }

    // --- 未登録タグを一括セット（後処理）
    const tagYamlIO = new TagYamlIO();
    const unregisteredService = new UnregisteredTagService(tagYamlIO);
    const updatedSummaries = await summaries.applyUnregisteredTags(
      this.app,
      unregisteredService
    );

    // --- 集計結果
    const totalUnregistered = updatedSummaries.getAllUnregisteredTags().length;
    logger.debug(
      `[UnregisteredTag] completed totalUnregistered=${totalUnregistered}`
    );

    // --- ファイル処理完了通知
    reporter?.onFinish(files.length - errorCount, errorCount);

    logger.info(
      `[NoteAnalysisRunner] complete. total=${files.length}, errors=${errorCount}`
    );
    if (errorCount > 0) {
      new Notice(
        `⚠️ ${errorCount}件のエラーが発生しました。詳細はログを確認してください。`
      );
    }

    return updatedSummaries;
  }
}
