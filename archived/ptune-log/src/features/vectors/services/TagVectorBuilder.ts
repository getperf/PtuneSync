import { App, Notice } from 'obsidian';
import { logger } from 'src/core/services/logger/loggerInstance';

import { Tags } from 'src/core/models/tags/Tags';
import { TagVectors } from 'src/core/models/vectors/TagVectors';
import { LLMClient } from 'src/core/services/llm/client/LLMClient';

/** タグ辞書からベクトルDBを生成する統合クラス */
export class TagVectorBuilder {
  constructor(private app: App, private llmClient: LLMClient) {}

  async build(): Promise<void> {
    logger.debug('[TagVectorBuilder.build] start');

    if (!this.llmClient.hasValidApiKey()) {
      new Notice('⚠️ LLM APIキーが未設定です。');
      logger.warn('[TagVectorBuilder] missing API key');
      return;
    }

    try {
      // Embedding利用可否を LLMClient に一任
      this.llmClient.ensureEmbeddingSupported();
    } catch (e) {
      new Notice('⚠️ Embedding利用判定でエラーが発生しました');
      logger.warn('[TagVectorBuilder] embedding not supported', e);
      return;
    }

    const tags = new Tags();
    await tags.load(this.app.vault);

    const tagCount = tags.getAll().length;
    if (tagCount === 0) {
      new Notice('⚠️ タグ辞書が見つかりません。');
      logger.warn('[TagVectorBuilder] no tags found');
      return;
    }

    logger.info(`[TagVectorBuilder] loaded ${tagCount} tags from YAML`);

    const vectors = new TagVectors(this.llmClient);
    await vectors.fromTags(this.app.vault, tags);
    await vectors.save(this.app.vault);

    new Notice(`✅ ベクトルDBを作成しました (${vectors.size()} 件)`);
    logger.info(`[TagVectorBuilder] completed: ${vectors.size()} entries`);
  }
}
