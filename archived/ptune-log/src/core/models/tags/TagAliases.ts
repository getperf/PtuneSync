// File: src/core/models/tags/TagAliases.ts
import { Vault } from 'obsidian';
import { normalizeTag } from '../../utils/tag/normalizeTag';
import { TagKindRegistry } from './TagKindRegistry';
import { TagAliasYamlIO } from 'src/core/services/yaml/TagAliasYamlIO';
import { logger } from 'src/core/services/logger/loggerInstance';
import { DateUtil } from 'src/core/utils/date/DateUtil';

export interface TagAliasRow {
  aliasName: string;
  tagKind: string;
  tagName: string;
  tagKey: string;
  checked: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * --- タグエイリアスの登録・正規化・永続化を管理するクラス
 */
export class TagAliases {
  private registry: TagKindRegistry | null = null;
  private map = new Map<string, TagAliasRow>(); // aliasName → Row

  private getRegistry(): TagKindRegistry {
    if (!this.registry) {
      this.registry = TagKindRegistry.getInstance();
    }
    return this.registry;
  }

  /** --- エイリアスを新規または更新登録 */
  upsert(row: Omit<TagAliasRow, 'createdAt' | 'updatedAt'>): void {
    const now = DateUtil.utcString();
    const existing = this.map.get(row.aliasName);

    if (existing) {
      logger.debug(
        `[TagAliases.upsert] update existing ${row.aliasName} → ${row.tagName}`
      );
      existing.tagName = row.tagName;
      existing.tagKey = row.tagKey;
      existing.checked = row.checked;
      existing.updatedAt = now;
    } else {
      logger.debug(
        `[TagAliases.upsert] insert new ${row.aliasName} → ${row.tagName}`
      );
      this.map.set(row.aliasName, {
        ...row,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  get(aliasName: string): TagAliasRow | undefined {
    return this.map.get(aliasName);
  }

  getUnchecked(): TagAliasRow[] {
    return Array.from(this.map.values()).filter(
      (r) => !r.checked && !r.isDeleted
    );
  }

  getAll(): TagAliasRow[] {
    return Array.from(this.map.values());
  }

  has(aliasName: string): boolean {
    return this.map.has(aliasName);
  }

  /** --- tagName一致で検索（To側の存在確認用） */
  findByTo(tagName: string): TagAliasRow | undefined {
    for (const row of this.map.values()) {
      if (row.tagName === tagName && !row.isDeleted) return row;
    }
    return undefined;
  }

  /** --- エイリアスから正規タグを返す */
  findCanonical(aliasName: string): string | undefined {
    const row = this.map.get(aliasName);
    if (row) {
      logger.debug(
        `[TagAliases.findCanonical] hit ${aliasName} → ${row.tagName}`
      );
      return row.tagName;
    } else {
      logger.debug(`[TagAliases.findCanonical] miss ${aliasName}`);
      return undefined;
    }
  }

  /** --- 未登録タグを既定値で登録 */
  registerIfMissing(tag: string): void {
    if (this.map.has(tag)) {
      logger.debug(`[TagAliases.registerIfMissing] already exists ${tag}`);
      return;
    }
    const tagKind = this.inferTagKind(tag);
    logger.debug(
      `[TagAliases.registerIfMissing] register new ${tag} kind:${tagKind}`
    );
    this.upsert({
      aliasName: tag,
      tagKind,
      tagName: tag,
      tagKey: '',
      checked: false,
      isDeleted: false,
    });
  }

  /** --- タグ名から種別を推定 */
  private inferTagKind(tag: string): string {
    const registry = this.getRegistry();
    const kind = registry.getKindOrUnclassified(tag);
    return kind.id;
  }

  /** --- タグ群を正規化・未確認タグを抽出 */
  normalizeAndRegisterWithDiff(tags: string[]): {
    normalized: string[];
    newTags: string[];
  } {
    logger.debug(`[TagAliases.normalizeAndRegister] input ${tags.length} tags`);
    const normalized: string[] = [];
    const newTags: string[] = [];

    const hits: string[] = [];
    const unchecked: string[] = [];
    const news: string[] = [];

    for (const tag of tags) {
      const row = this.map.get(tag);

      if (!row) {
        this.registerIfMissing(tag);
        news.push(tag);
        normalized.push(tag);
        newTags.push(tag);
        continue;
      }

      normalized.push(row.tagName || tag);

      if (!row.checked && !row.isDeleted) {
        unchecked.push(tag);
        newTags.push(tag);
      } else {
        hits.push(tag);
      }
    }

    this.logResolveResult(hits, unchecked, news);

    return { normalized: [...new Set(normalized)], newTags };
  }

  /** --- エイリアス解決結果を1行でログ出力 */
  private logResolveResult(
    hits: string[],
    unchecked: string[],
    news: string[]
  ): void {
    const parts = [
      hits.length && `HIT=${hits.length} [${hits.join(',')}]`,
      unchecked.length &&
        `UNCHECKED=${unchecked.length} [${unchecked.join(',')}]`,
      news.length && `NEW=${news.length} [${news.join(',')}]`,
    ].filter(Boolean);

    if (parts.length) {
      logger.debug(`[TagAliases.resolve] ${parts.join(' | ')}`);
    }
  }

  /** --- 保存前にチェック済みに更新 */
  prepareForSave(): void {
    const now = DateUtil.utcString();
    for (const alias of this.getAll()) {
      if (!alias.checked) {
        alias.checked = true;
        alias.updatedAt = now;
        if (!alias.createdAt) alias.createdAt = now;
      }
    }
  }

  /** --- 正規化キーでグループ化 */
  groupByNormalized(): Map<string, TagAliasRow[]> {
    const result = new Map<string, TagAliasRow[]>();
    for (const row of this.getAll()) {
      const norm = row.tagKey || normalizeTag(row.aliasName);
      const group = result.get(norm) ?? [];
      group.push(row);
      result.set(norm, group);
    }
    return result;
  }

  /** --- 更新をリセット（無効化されたエイリアスを戻す） */
  resetUpdate(selected: Map<string, boolean>): void {
    for (const alias of this.getAll()) {
      const active = selected.get(alias.aliasName);
      if (active === false) alias.tagName = alias.aliasName;
    }
  }

  /** --- YAMLへ保存 */
  async save(vault: Vault): Promise<void> {
    logger.info(`[TagAliases.save] writing ${this.getAll().length} rows`);
    const io = new TagAliasYamlIO();
    await io.save(vault, this.getAll());
  }

  /** --- YAMLから読み込み */
  async load(vault: Vault): Promise<void> {
    const io = new TagAliasYamlIO();
    const loaded = await io.load(vault);
    this.map.clear();
    for (const row of loaded) {
      this.map.set(row.aliasName, row);
    }
    logger.info(`[TagAliases.load] loaded ${this.map.size} rows`);
  }
}
