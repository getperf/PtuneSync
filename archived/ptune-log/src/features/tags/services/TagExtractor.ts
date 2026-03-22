import { App } from 'obsidian';
import { TagKindRegistry } from 'src/core/models/tags/TagKindRegistry';
import { TagRow, Tags } from 'src/core/models/tags/Tags';
import { logger } from 'src/core/services/logger/loggerInstance';
import { normalizeTag } from 'src/core/utils/tag/normalizeTag';

export interface RawTagEntry {
  tag: string; // #除去済みタグ名
  count: number;
}

export interface ExtractOptions {
  /**
   * 未分類タグ（kind.id === 'unclassified'）を除外する
   * @default false
   */
  excludeUnclassified?: boolean;
}

/**
 * ノート全体からタグを抽出し、分類情報を付与して Tags モデルを構築するクラス
 */
export class TagExtractor {
  private registry: TagKindRegistry | null = null;

  /**
   * タグ分類レジストリの取得（キャッシュあり）
   */
  private getRegistry(): TagKindRegistry {
    if (!this.registry) {
      this.registry = TagKindRegistry.getInstance();
    }
    return this.registry;
  }

  /**
   * 全Markdownファイルからタグを抽出（YAMLタグ・インラインタグ含む）
   */
  static extractAll(app: App): RawTagEntry[] {
    const tagMap: Record<string, number> = {};
    const files = app.vault.getMarkdownFiles();
    logger.debug(`[TagExtractor.extractAll] start: totalFiles=${files.length}`);

    for (const file of files) {
      const cache = app.metadataCache.getFileCache(file);
      if (!cache) continue;

      const yamlTags = cache.frontmatter?.tags;
      const tags = Array.isArray(yamlTags)
        ? yamlTags
        : yamlTags
          ? [yamlTags]
          : [];
      const inlineTags = cache.tags?.map((t) => t.tag) ?? [];
      const all = [...tags, ...inlineTags];

      for (const tag of all) {
        if (typeof tag !== 'string') continue;
        const cleaned = normalizeTag(tag);
        if (!cleaned) continue;
        tagMap[cleaned] = (tagMap[cleaned] ?? 0) + 1;
      }
    }

    const result = Object.entries(tagMap).map(([tag, count]) => ({
      tag,
      count,
    }));
    logger.debug(`[TagExtractor.extractAll] extracted=${result.length}`);
    return result;
  }

  /**
   * タグ抽出＋分類＋Tagsモデル構築を実行
   */
  static async extractAndGroup(app: App): Promise<Tags> {
    logger.debug('[TagExtractor.extractAndGroup] start');
    const raw = this.extractAll(app);
    const registry = TagKindRegistry.getInstance();
    await registry.ensure();
    const tags = new Tags();

    for (const entry of raw) {
      const kind = registry.getKindOrUnclassified(entry.tag);
      const row: TagRow = {
        name: entry.tag,
        tagKind: kind.id,
        count: entry.count,
      };
      tags.merge(kind.id, [row]);
    }

    logger.debug(
      `[TagExtractor.extractAndGroup] grouped: totalKinds=${
        registry.getAll().length
      }, totalTags=${tags.getAll().length}`,
    );
    return tags;
  }

  /**
   * 差分検知用：RawTagEntry を Map 化して返す
   */
  static async extractAllAsMap(
    app: App,
    options: ExtractOptions = {},
  ): Promise<Map<string, RawTagEntry>> {
    const { excludeUnclassified = false } = options;

    logger.debug('[TagExtractor.extractAllAsMap] start');

    const registry = TagKindRegistry.getInstance();
    await registry.ensure();

    const tags = this.extractAll(app);
    const tagEntries = new Map<string, RawTagEntry>();

    for (const tag of tags) {
      const tagName = tag.tag;
      if (excludeUnclassified) {
        const kind = registry.getKindOrUnclassified(tagName);
        if (kind.id === 'unclassified') continue;
      }
      tagEntries.set(tagName, tag);
    }

    logger.debug(`[TagExtractor.extractAllAsMap] mapped=${tagEntries.size}`);
    return tagEntries;
  }
}
