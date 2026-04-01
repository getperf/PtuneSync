import { App, TFolder } from 'obsidian';
import { TagCandidate } from 'src/core/models/tags/TagCandidate';
import { TagVectorSearcher } from 'src/core/services/vector/TagVectorSearcher';
import { logger } from 'src/core/services/logger/loggerInstance';

/**
 * フォルダ名に基づく共通タグ推論戦略
 * - フォルダ名の文字列をクエリとしてベクトル検索を行う
 */
export class FolderNameTagSuggestionStrategy {
  constructor(private app: App, private vectorSearcher: TagVectorSearcher) { }

  /**
   * フォルダ名からタグ候補を類似検索で抽出する
   * - ベクトル検索により TagCandidate[] を返す
   */
  async suggestTags(folder: TFolder): Promise<TagCandidate[]> {
    const keyword = folder.name;
    const limit = 10;

    logger.debug(
      `[FolderNameTagSuggestionStrategy] search vector tags for "${keyword}"`
    );

    const results = await this.vectorSearcher.search(keyword, { limit });
    return results;
  }
}
