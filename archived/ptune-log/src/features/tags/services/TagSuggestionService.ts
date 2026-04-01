// File: src/features/tags/services/TagSuggestionService.ts

import { App } from 'obsidian';
import { TagYamlIO } from 'src/core/services/yaml/TagYamlIO';
import { Tags } from 'src/core/models/tags/Tags';
import { TagCandidate } from 'src/core/models/tags/TagCandidate';
import { TagVectorSearcher } from 'src/core/services/vector/TagVectorSearcher';
import { logger } from 'src/core/services/logger/loggerInstance';
import { LLMClient } from 'src/core/services/llm/client/LLMClient';
import type { TargetTagSearchPort } from 'src/core/ui/tags/TargetTagSearchPort';

export type TagSearchMode = 'normal' | 'vector';

export interface TagSearchOptions {
  mode?: TagSearchMode;
  limit?: number;
}

/**
 * TagSuggestionService
 * -----------------------------------------
 * タグ候補検索サービス（UIから使いやすい形に整理）
 * - TargetTagEditorDialog の SearchPort として直接利用可能
 * - normal/vector の呼び出しを明確に分離し、有償 vector の誤実行を防ぐ
 */
export class TagSuggestionService implements TargetTagSearchPort {
  private tags = new Tags();
  private loaded = false;
  private vectorSearcher: TagVectorSearcher;

  constructor(
    private readonly app: App,
    private readonly llmClient: LLMClient
  ) {
    this.vectorSearcher = new TagVectorSearcher(app, llmClient);
  }

  // ===== SearchPort (UI向け) =====

  isVectorAvailable(): boolean {
    const available = !!this.llmClient?.isVectorSearchAvailable();
    logger.debug(`[TagSuggestionService] vectorAvailable=${available}`);
    return available;
  }

  async searchNormal(query: string): Promise<TagCandidate[]> {
    return this.searchCandidates(query, { mode: 'normal' });
  }

  async searchVector(query: string): Promise<TagCandidate[]> {
    return this.searchCandidates(query, { mode: 'vector' });
  }

  // ===== 既存API（互換維持） =====

  async searchCandidates(
    keyword: string,
    options?: TagSearchOptions
  ): Promise<TagCandidate[]> {
    await this.ensureLoaded();

    const mode: TagSearchMode = options?.mode ?? 'normal';
    const limit = options?.limit ?? 50;

    const q = (keyword ?? '').trim();
    logger.debug(
      `[TagSuggestionService.searchCandidates] mode=${mode} keyword="${q}" limit=${limit}`
    );

    if (mode === 'vector') {
      if (!this.isVectorAvailable()) return [];
      return this.vectorSearcher.search(q, { limit });
    }

    return this.searchTextCandidates(q, limit);
  }

  // ===== internal =====

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;

    const io = new TagYamlIO();
    await io.ensure(this.app);
    await this.tags.load(this.app.vault);
    this.loaded = true;

    logger.debug(
      `[TagSuggestionService.ensureLoaded] tags loaded: total=${
        this.tags.getAll().length
      }`
    );
  }

  private searchTextCandidates(keyword: string, limit: number): TagCandidate[] {
    // 表示名は階層全体を維持、検索キーのみ末尾を使う（既存踏襲）
    const key = keyword.split('/').pop()?.toLowerCase() ?? '';
    const matched = this.tags.searchByKeyword(keyword, limit);

    logger.debug(
      `[TagSuggestionService.searchTextCandidates] key=${key} found=${matched.length}`
    );

    return matched.map((t) => ({
      name: t.name,
      count: t.count,
      tagKind: t.tagKind,
    }));
  }
}
