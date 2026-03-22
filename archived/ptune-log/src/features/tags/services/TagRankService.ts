import { App } from 'obsidian';
import { TagKindRegistry } from 'src/core/models/tags/TagKindRegistry';
import { logger } from 'src/core/services/logger/loggerInstance';
import { TagYamlIO } from 'src/core/services/yaml/TagYamlIO';

/**
 * タグランキング生成サービス
 * - 各タグ種別ごとの上位タグを整形して出力
 */
export class TagRankService {
  constructor(private app: App) {}

  /**
   * 各タグ種別ごとの出現頻度上位タグを整形して返す
   * @param limit 上位件数（デフォルト30）
   */
  async getFormattedTopTags(limit = 30): Promise<string> {
    logger.debug(`[TagRankService.getFormattedTopTags] start (limit=${limit})`);

    const registry = TagKindRegistry.getInstance();
    const tagLoader = new TagYamlIO();
    await tagLoader.ensure(this.app);
    const tags = await tagLoader.load(this.app.vault);

    logger.debug(
      `[TagRankService.getFormattedTopTags] loaded tags=${tags.length}`
    );

    const sections: string[] = [];

    for (const kind of registry.getAll()) {
      const rows = tags
        .filter((row) => row.tagKind === kind.id)
        .filter((row) => row.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

      if (rows.length === 0) continue;

      sections.push(`### 🏷 ${kind.label}タグ上位（最大${limit}件）`);
      sections.push(...rows.map((r) => `- ${r.name}`), '');
      logger.debug(
        `[TagRankService.getFormattedTopTags] kind=${kind.id} topCount=${rows.length}`
      );
    }

    const result = sections.join('\n');
    logger.debug('[TagRankService.getFormattedTopTags] completed');
    return result;
  }
}
