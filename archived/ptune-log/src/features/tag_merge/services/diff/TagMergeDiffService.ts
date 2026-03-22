// features/tag_merge/services/diff/TagMergeDiffService.ts

import { App } from 'obsidian';
import { LLMClient } from 'src/core/services/llm/client/LLMClient';
import { Tags } from 'src/core/models/tags/Tags';
import { TagVectors } from 'src/core/models/vectors/TagVectors';
import { TagExtractor } from 'src/features/tags/services/TagExtractor';
import { logger } from 'src/core/services/logger/loggerInstance';
import { TagDBDiffResult } from '../../models/TagDBDiffResult';

export type TagMergeDiffSummary = {
  tagDB: TagDBDiffResult;
  vectorDB: TagDBDiffResult;
};

export class TagMergeDiffService {
  constructor(
    private readonly app: App,
    private readonly llmClient: LLMClient,
  ) {}

  /**
   * 差分検知（キー単位）
   * - ノート由来タグ（未分類除外）を正とする
   */
  async detect(): Promise<TagMergeDiffSummary> {
    // --- ノート由来タグ（未分類除外）
    const sourceMap = await TagExtractor.extractAllAsMap(this.app, {
      excludeUnclassified: true,
    });
    const sourceKeys = new Set(sourceMap.keys());

    // --- Tags DB
    const tags = new Tags();
    await tags.load(this.app.vault);
    const tagDbKeys = new Set(tags.getRawEntryMap().keys());

    const tagDB: TagDBDiffResult = {
      added: [...sourceKeys].filter((k) => !tagDbKeys.has(k)),
      removed: [...tagDbKeys].filter((k) => !sourceKeys.has(k)),
    };

    // --- Vector DB
    const vectors = new TagVectors(this.llmClient);
    await vectors.loadFromVault(this.app.vault);
    const vectorKeys = new Set(vectors.getRawEntryMap().keys());

    const vectorDB: TagDBDiffResult = {
      added: [...sourceKeys].filter((k) => !vectorKeys.has(k)),
      removed: [...vectorKeys].filter((k) => !sourceKeys.has(k)),
    };

    logger.debug(
      `[TagMergeDiffService] diff detected: ` +
        `tagDB(add=${tagDB.added.length}, del=${tagDB.removed.length}), ` +
        `vectorDB(add=${vectorDB.added.length}, del=${vectorDB.removed.length})`,
    );

    return { tagDB, vectorDB };
  }

  /**
   * UI 表示用メッセージ生成（件数のみ）
   */
  buildMessages(summary: TagMergeDiffSummary): string[] {
    const messages: string[] = [];

    const { tagDB, vectorDB } = summary;

    if (tagDB.added.length > 0 || tagDB.removed.length > 0) {
      messages.push(
        `タグDB: 追加 ${tagDB.added.length} / 削除 ${tagDB.removed.length}`,
      );
    } else {
      messages.push('タグDB: 差分なし');
    }

    if (vectorDB.added.length > 0 || vectorDB.removed.length > 0) {
      messages.push(
        `ベクトルDB: 追加 ${vectorDB.added.length} / 削除 ${vectorDB.removed.length}`,
      );
      messages.push('※ ベクトル更新は時間・コストがかかります');
    } else {
      messages.push('ベクトルDB: 差分なし');
    }

    return messages;
  }
}
