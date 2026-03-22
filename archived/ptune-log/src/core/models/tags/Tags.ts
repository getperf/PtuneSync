import { Vault } from 'obsidian';
import { TagYamlIO } from '../../services/yaml/TagYamlIO';
import { logger } from 'src/core/services/logger/loggerInstance';
import { RawTagEntry } from 'src/features/tags/services/TagExtractor';

// --- タグ統計情報（tag.yaml）を管理するクラス
export interface TagRow {
  name: string;
  tagKind: string;
  count: number;
}

export class Tags {
  private map = new Map<string, TagRow>();

  // --- 各種別ごとのタグ情報をマージ
  merge(tagKind: string, rows: TagRow[]): void {
    for (const row of rows) {
      this.map.set(row.name, { ...row, tagKind });
    }
  }

  getAll(): TagRow[] {
    return Array.from(this.map.values());
  }

  getByKind(kindId: string): TagRow[] {
    return this.getAll().filter((r) => r.tagKind === kindId);
  }

  getCount(name: string): number | undefined {
    return this.map.get(name)?.count;
  }

  // --- YAMLへ保存
  async save(vault: Vault): Promise<void> {
    logger.info(`[Tags.save] writing ${this.map.size} rows`);
    const io = new TagYamlIO();
    await io.save(vault, this.getAll());
  }

  // --- YAMLから読み込み
  async load(vault: Vault): Promise<void> {
    const io = new TagYamlIO();
    const loaded = await io.load(vault);
    this.map.clear();
    for (const row of loaded) {
      this.map.set(row.name, row);
    }
    logger.info(`[Tags.load] loaded ${this.map.size} rows`);
  }

  getMap(): Map<string, TagRow> {
    return this.map;
  }

  /** Embedding対象のタグ行を取得 */
  getEmbeddingTags(): TagRow[] {
    return this.getAll().filter((r) => r.count > 0);
  }

  /** Embedding対象名一覧を取得 */
  getTagNames(): string[] {
    return this.getEmbeddingTags().map((r) => r.name);
  }

  /**
   * キーワードで部分一致検索（TagSuggestionService から移譲）
   */
  searchByKeyword(keyword: string, limit = 50): TagRow[] {
    const key = keyword.split('/').pop()?.toLowerCase() ?? '';
    const matched = this.getAll()
      .filter((t) => t.name.toLowerCase().includes(key))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    logger.debug(
      `[Tags.searchByKeyword] keyword="${key}" found=${matched.length}`,
    );
    return matched;
  }

  /**
   * 差分検知用：RawTagEntry Map を取得
   */
  getRawEntryMap(): Map<string, RawTagEntry> {
    const map = new Map<string, RawTagEntry>();

    for (const row of this.map.values()) {
      map.set(row.name, {
        tag: row.name,
        count: row.count,
      });
    }

    return map;
  }
}
