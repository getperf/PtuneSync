import { App } from 'obsidian';
import { TagVectors } from 'src/core/models/vectors/TagVectors';
import { TagCandidate } from 'src/core/models/tags/TagCandidate';
import { logger } from 'src/core/services/logger/loggerInstance';
import { LLMClient } from '../llm/client/LLMClient';

/** 検索オプション（すべて降順固定） */
export interface TagSearchOptions {
  limit?: number; // 最大件数（default: 50）
  minScore?: number; // score の閾値（default: 0.0）
  sortBy?: 'score' | 'count'; // 降順固定（default: score）
}

/**
 * TagVectorSearcher
 * -----------------------------------------
 * ベクトルDB(TagVectors) を使った類似タグ検索クラス。
 */
export class TagVectorSearcher {
  private vectors: TagVectors | null = null;
  private loaded = false;

  constructor(private app: App, private llmClient: LLMClient) {}

  /** ベクトルDBの初期ロードを保証 */
  async ensure(): Promise<void> {
    if (this.loaded) return;

    const vectors = new TagVectors(this.llmClient);
    await vectors.loadFromVault(this.app.vault);
    this.vectors = vectors;
    this.loaded = true;

    logger.debug('[TagVectorSearcher.ensure] VectorDB loaded');
  }

  /** 利用可能判定 */
  async isAvailable(): Promise<boolean> {
    await this.ensure();

    const hasVectors = !!this.vectors && this.vectors.size() > 0;

    // LLM側のベクトル検索可否は Promise の可能性があるため await
    const llmAvailable = this.llmClient.isVectorSearchAvailable();

    const available = hasVectors && llmAvailable;

    // boolean を明示的に出力
    logger.debug(
      `[TagVectorSearcher.isAvailable] available=${String(available)}, ` +
        `hasVectors=${hasVectors}, llmAvailable=${llmAvailable}`
    );

    return available;
  }

  /**
   * 類似タグ検索（オプション対応）
   * @param keyword 検索文字列
   * @param options 検索オプション
   */
  async search(
    keyword: string,
    options: TagSearchOptions = {}
  ): Promise<TagCandidate[]> {
    await this.ensure();

    if (!this.vectors || this.vectors.size() === 0) {
      logger.warn('[TagVectorSearcher.search] skipped: vector DB empty');
      return [];
    }

    const opt: Required<TagSearchOptions> = {
      limit: options.limit ?? 50,
      minScore:
        options.minScore ?? this.llmClient.settings.minSimilarityScore ?? 0.0, // ★ LLM設定が優先
      sortBy: options.sortBy ?? 'score',
    };

    const queryVec = await this.llmClient.embed(keyword);
    if (!queryVec) {
      logger.warn('[TagVectorSearcher.search] skipped: embedding failed');
      return [];
    }

    let results = this.vectors.findSimilar(queryVec, opt.limit);

    // --- 1) score 閾値適用 ---
    results = results.filter((r) => r.score >= opt.minScore);

    // --- 2) ソート（降順固定） ---
    if (opt.sortBy === 'count') {
      results.sort((a, b) => b.count - a.count);
    } else {
      results.sort((a, b) => b.score - a.score);
    }

    // --- 3) 最終 limit ---
    results = results.slice(0, opt.limit);

    logger.debug(
      `[TagVectorSearcher.search] keyword="${keyword}" → result count=${results.length}`
    );

    return results;
  }
}
