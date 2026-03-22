import { Vault, normalizePath } from 'obsidian';
import { Tags } from '../tags/Tags';
import { cosineSimilarity } from 'src/core/utils/vector/vectorUtils';
import { logger } from 'src/core/services/logger/loggerInstance';
import { DateUtil } from 'src/core/utils/date/DateUtil';
import { LLMClient } from 'src/core/services/llm/client/LLMClient';
import { RawTagEntry } from 'src/features/tags/services/TagExtractor';
import { normalizeTag } from 'src/core/utils/tag/normalizeTag';

/** タグ1件分のEmbeddingデータ構造 */
export interface TagVector {
  key: string;
  embedding: number[];
  count: number;
}

/** タグベクトル集合クラス */
export class TagVectors {
  private vectors: TagVector[] = [];

  /** ベクトルDB関連パスの定数定義 */
  private static readonly META_DIR = '_tagging/meta';
  private static readonly VECTOR_DB_FILE = 'tag_vectors.jsonl';
  private static readonly META_INFO_FILE = 'tag_db_info.json';

  static getVectorDbPath(): string {
    return normalizePath(`${this.META_DIR}/${this.VECTOR_DB_FILE}`);
  }

  static getMetaInfoPath(): string {
    return normalizePath(`${this.META_DIR}/${this.META_INFO_FILE}`);
  }

  constructor(private llmClient: LLMClient) {}

  /** Tags から Embedding を生成して内部に格納（tail + 正規化） */
  /** Tags から Embedding を生成して内部に格納（tail のみ） */
  async fromTags(vault: Vault, tags: Tags): Promise<void> {
    const embeddingTags = tags.getEmbeddingTags();
    if (embeddingTags.length === 0) {
      logger.warn('[TagVectors.fromTags] no tags found for embedding');
      return;
    }

    logger.info(
      `[TagVectors.fromTags] generating embeddings for ${embeddingTags.length} tags (tail-only)`,
    );

    // ★ 末尾ワードのみ抽出
    const embedTexts = embeddingTags
      .map((t) => this.extractTail(t.name))
      .filter((t): t is string => !!t);

    if (embedTexts.length === 0) {
      logger.warn('[TagVectors.fromTags] no valid tail texts for embedding');
      return;
    }

    let embeddings: number[][];

    try {
      embeddings = await this.llmClient.embedBatch(embedTexts);
    } catch (err) {
      // 失敗時は vectors を触らない
      logger.error(
        '[TagVectors.fromTags] embedding failed, keep existing vectors',
        err,
      );
      return;
    }

    if (!embeddings || embeddings.length !== embedTexts.length) {
      logger.error(
        '[TagVectors.fromTags] embedding result invalid, skip update',
        { expected: embedTexts.length, actual: embeddings?.length },
      );
      return;
    }

    // ★ 成功した場合のみ更新
    let embIndex = 0;
    this.vectors = embeddingTags
      .map((row) => {
        const tail = this.extractTail(row.name);
        if (!tail) return null;

        const v = {
          key: row.name, // 元タグ（フルパス）
          embedding: embeddings[embIndex],
          count: row.count,
        };
        embIndex += 1;
        return v;
      })
      .filter((v): v is TagVector => v !== null);
  }

  /** ベクトルデータを `_tagging/meta` に保存 */
  async save(vault: Vault): Promise<void> {
    if (this.vectors.length === 0) {
      logger.warn(
        '[TagVectors.save] vectors is empty, skip saving to avoid overwrite',
      );
      return;
    }

    const dbPath = TagVectors.getVectorDbPath();
    const infoPath = TagVectors.getMetaInfoPath();

    const lines = this.vectors.map((v) => JSON.stringify(v));
    await vault.adapter.write(dbPath, lines.join('\n'));

    const info = {
      created_at: DateUtil.utcString(),
      total: this.vectors.length,
      model: this.llmClient['settings']?.embeddingModel ?? 'unknown',
      strategy: 'tail+normalize',
    };
    await vault.adapter.write(infoPath, JSON.stringify(info, null, 2));

    logger.info(`[TagVectors.save] saved ${this.vectors.length} vectors`);
  }

  /** タグの末尾ワードを安全に抽出する */
  private extractTail(tag: string): string | null {
    if (!tag) return null;

    // 末尾の / を除去
    const trimmed = tag.replace(/\/+$/, '');
    if (!trimmed) return null;

    const parts = trimmed.split('/');
    const tail = parts[parts.length - 1]?.trim();

    return tail || null;
  }

  /** ベクトルデータをロード */
  async loadFromVault(vault: Vault): Promise<void> {
    const path = TagVectors.getVectorDbPath();
    const file = vault.getAbstractFileByPath(path);
    if (!file) {
      logger.warn(`[TagVectors.loadFromVault] file not found: ${path}`);
      this.vectors = [];
      return;
    }
    const data = await vault.adapter.read(path);
    this.vectors = data
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as TagVector);
    logger.info(
      `[TagVectors.loadFromVault] loaded ${this.vectors.length} vectors`,
    );
  }

  /** クエリベクトルとの類似検索 */
  findSimilar(queryVec: number[], limit = 50) {
    const scored = this.vectors
      .map((v) => ({
        name: v.key,
        count: v.count,
        score: cosineSimilarity(v.embedding, queryVec),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    logger.debug(
      `[TagVectors.findSimilar] done: top=${scored.length}, top1=${
        scored[0]?.name ?? 'none'
      }`,
    );
    return scored;
  }

  /** getter群 */
  getAll(): TagVector[] {
    return this.vectors;
  }

  getRawEntryMap(): Map<string, RawTagEntry> {
    const map = new Map<string, RawTagEntry>();
    for (const v of this.vectors) {
      map.set(v.key, {
        tag: v.key,
        count: v.count,
      });
    }
    return map;
  }

  getKeySet(): Set<string> {
    return new Set(this.vectors.map((v) => v.key));
  }

  size(): number {
    return this.vectors.length;
  }
}
