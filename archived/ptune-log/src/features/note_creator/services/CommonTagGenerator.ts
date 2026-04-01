import { App, TFolder, Notice } from 'obsidian';
import { TagAliases } from 'src/core/models/tags/TagAliases';
import { TagVectorSearcher } from 'src/core/services/vector/TagVectorSearcher';
import { FolderIndexWriterService } from 'src/core/services/notes/FolderIndexWriterService';
import { logger } from 'src/core/services/logger/loggerInstance';

import type { ITagSuggestionStrategy } from '../strategies/ITagSuggestionStrategy';
import { SummaryTagSuggestionStrategy } from '../strategies/SummaryTagSuggestionStrategy';
import { LLMClient } from 'src/core/services/llm/client/LLMClient';

/**
 * 共通タグ生成サービス
 * - 指定フォルダの index.md に対して共通タグを適用
 * - Strategy によりタグ候補を決定
 */
export class CommonTagGenerator {
  private vectorSearcher: TagVectorSearcher;
  private strategy: ITagSuggestionStrategy;

  constructor(
    private readonly app: App,
    private readonly llmClient: LLMClient,
    strategy?: ITagSuggestionStrategy
  ) {
    this.vectorSearcher = new TagVectorSearcher(app, llmClient);
    // 既定：センテンス解析 Strategy
    this.strategy =
      strategy ?? new SummaryTagSuggestionStrategy(app, this.vectorSearcher);
  }

  /**
   * 指定フォルダの index.md に共通タグを適用
   */
  async applyTagsToIndex(folder: TFolder): Promise<string[]> {
    const available = await this.vectorSearcher.isAvailable();
    if (!available) {
      new Notice('⚠️ ベクトル検索が利用できません');
      logger.warn('[CommonTagGenerator] vector search unavailable');
      return [];
    }

    const folderPath = folder.path;
    const indexWriter = new FolderIndexWriterService(this.app);

    await indexWriter.ensureIndexNote(folderPath);

    logger.debug(
      `[CommonTagGenerator] start generate tags folder=${folderPath}`
    );

    const candidates = await this.strategy.suggestTags(folder);
    const rawTags = candidates.map((c) => c.name);

    const aliases = new TagAliases();
    await aliases.load(this.app.vault);

    const { normalized } = aliases.normalizeAndRegisterWithDiff(rawTags);

    await indexWriter.updateTags(folderPath, normalized);

    logger.debug(
      `[CommonTagGenerator] normalized tags: ${normalized.join(', ')}`
    );

    return normalized;
  }
}
