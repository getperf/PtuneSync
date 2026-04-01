import { parseYaml } from 'obsidian';
import { logger } from 'src/core/services/logger/loggerInstance';

/**
 * FolderIndexParser
 * - フォルダ直下の index.md の frontmatter を解析
 * - created, updated, commonTags を抽出（記録ノートとは独立）
 */
export interface FolderIndexMetadata {
  created?: string;
  updated?: string;
  commonTags?: string[];
}

export class FolderIndexParser {
  /**
   * マークダウンテキストから frontmatter を抽出・解析
   */
  static parse(text: string): FolderIndexMetadata {
    const match = text.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return { commonTags: [] };

    try {
      const fm = parseYaml(match[1]);

      return {
        created: typeof fm.created === 'string' ? fm.created : undefined,
        updated: typeof fm.updated === 'string' ? fm.updated : undefined,
        commonTags: Array.isArray(fm.commonTags)
          ? fm.commonTags
          : Array.isArray(fm.tags) // 後方互換
          ? fm.tags
          : [],
      };
    } catch (e) {
      logger.warn('[FolderIndexParser] YAML parse error', e);
      return { commonTags: [] };
    }
  }
}
