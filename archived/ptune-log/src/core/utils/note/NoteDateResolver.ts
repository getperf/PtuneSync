import { TFile, MetadataCache, App } from 'obsidian';
import { logger } from 'src/core/services/logger/loggerInstance';

/**
 * --- NoteDateResolver
 * ノートファイルの YAML またはファイルパスから日付を解析するユーティリティクラス。
 */
export class NoteDateResolver {
  /** --- YAML frontmatter の dailynote フィールドから日付を抽出
   * 例: dailynote: "[[_journal/2025-08-12|2025-08-12]]"
   */
  static resolveDateFromYaml(
    file: TFile,
    metadataCache: MetadataCache
  ): Date | undefined {
    const cache = metadataCache.getFileCache(file);
    const frontmatter = cache?.frontmatter;

    if (!frontmatter) {
      return undefined;
    }

    const raw = frontmatter['dailynote'];
    if (typeof raw !== 'string') {
      return undefined;
    }

    const match = raw.match(/\|\s*(\d{4}-\d{2}-\d{2})\s*\]\]?$/);
    if (!match) {
      return undefined;
    }

    const dateStr = match[1];
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return undefined;
    }

    return date;
  }

  /** --- ファイルパスから日付を抽出（例: _journal/2025-08-12.md） */
  static resolveDateFromPath(file: TFile): Date | undefined {
    const match = file.path.match(/(\d{4}-\d{2}-\d{2})/);

    if (!match) {
      return undefined;
    }

    const dateStr = match[1];
    const date = new Date(dateStr);

    if (isNaN(date.getTime())) {
      return undefined;
    }

    logger.debug(`[NoteDateResolver] resolved date from path: ${dateStr}`);
    return date;
  }

  /** --- YAML優先で日付を解析し、取得できなければパスから解析する */
  static resolveDate(file: TFile, app: App): Date | null {
    const cache = app.metadataCache.getFileCache(file);
    const dailynoteField = cache?.frontmatter?.dailynote as string | undefined;
    if (dailynoteField) {
      const m = dailynoteField.match(/\d{4}-\d{2}-\d{2}/);
      if (m) return new Date(m[0]);
    }

    // fallback: frontmatter 文字列パース
    const text = cache?.frontmatter ? JSON.stringify(cache.frontmatter) : '';
    const m2 = text.match(/\d{4}-\d{2}-\d{2}/);
    if (m2) return new Date(m2[0]);

    logger.info(`[NoteDateResolver] no dailynote found in ${file.path}`);
    return null;
  }
}
