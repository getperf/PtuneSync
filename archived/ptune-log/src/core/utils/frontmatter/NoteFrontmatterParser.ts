// File: src/core/utils/frontmatter/NoteFrontmatterParser.ts
import { App, TFile, parseYaml } from 'obsidian';
import { logger } from 'src/core/services/logger/loggerInstance';

export interface ParsedFrontmatter {
  createdAt?: string;
  dailynote?: string;
  taskKey?: string;
  goal?: string;
  summary?: string;
  tags?: string[];
}

export class NoteFrontmatterParser {
  /**
   * Obsidian の metadataCache から frontmatter を取得
   * - こちらを優先的に使用
   */
  private static parseFromCache(app: App, file: TFile): ParsedFrontmatter | null {
    const cache = app.metadataCache.getFileCache(file);
    const raw = cache?.frontmatter;

    if (!raw || typeof raw !== "object") {
      return null;
    }

    const fm = raw as Record<string, unknown>;

    const parseString = (v: unknown): string | undefined =>
      typeof v === "string" ? v : undefined;

    const sanitizeDailynote = (v: unknown): string | undefined => {
      if (typeof v !== "string") return undefined;
      const s = v.trim();
      return s.startsWith("[[") && s.includes("|") ? s : undefined;
    };

    return {
      createdAt: parseString(fm["createdAt"]),
      dailynote: sanitizeDailynote(fm["dailynote"]),
      taskKey: parseString(fm["taskKey"]),
      goal: parseString(fm["goal"]),
      summary: parseString(fm["summary"]) || "",
      tags: Array.isArray(fm["tags"]) ? (fm["tags"] as string[]) : [],
    };
  }

  /**
   * テキストからfrontmatterを直接解析（フォールバック用）
   */
  static parse(text: string): ParsedFrontmatter {
    // 先頭の空白やBOMを許容
    const match = text.match(/^\s*---\n([\s\S]*?)\n---/);

    if (!match) {
      logger.debug(
        `[NoteFrontmatterParser] frontmatter NOT FOUND (match failed)`
      );
      return {};
    }

    const raw = match[1];
    logger.debug(`[NoteFrontmatterParser] raw frontmatter:\n${raw}`);

    try {
      const fm: any = parseYaml(raw);

      const createdAt =
        typeof fm?.createdAt === 'string' ? fm.createdAt : undefined;
      const dailynote =
        typeof fm?.dailynote === 'string' ? fm.dailynote : undefined;
      const taskKey = typeof fm?.taskKey === 'string' ? fm.taskKey : undefined;
      const goal = typeof fm?.goal === 'string' ? fm.goal : undefined;
      const summary = typeof fm?.summary === 'string' ? fm.summary : '';
      const tags = Array.isArray(fm?.tags) ? fm.tags : [];

      logger.debug(
        `[NoteFrontmatterParser] Parsed (text): createdAt=${createdAt}, dailynote="${dailynote}", taskKey=${taskKey}`
      );

      return { createdAt, dailynote, taskKey, goal, summary, tags };
    } catch (e) {
      logger.warn('[NoteFrontmatterParser] Invalid YAML detected', e);
      return {};
    }
  }

  /**
   * ObsidianのTFileからfrontmatterを解析
   * - ① metadataCache から取得
   * - ② 取れない場合のみテキスト読み＋parse()
   */
  static async parseFromFile(app: App, file: TFile): Promise<ParsedFrontmatter> {
    // ① metadataCache 優先
    const fromCache = this.parseFromCache(app, file);
    if (fromCache) {
      return fromCache;
    }

    // ② キャッシュに無い／壊れている場合のみテキストを読む
    try {
      const content = await app.vault.read(file);
      return this.parse(content);
    } catch (e) {
      logger.error(
        `[NoteFrontmatterParser.parseFromFile] failed: ${file.path}`,
        e
      );
      return {};
    }
  }

  static isLLMTagGenerated(fm: ParsedFrontmatter): boolean {
    const hasTags = Array.isArray(fm?.tags) && fm.tags.length > 0;
    const hasSummary =
      typeof fm?.summary === 'string' && fm.summary.trim() !== '';
    return hasTags || hasSummary;
  }
}
