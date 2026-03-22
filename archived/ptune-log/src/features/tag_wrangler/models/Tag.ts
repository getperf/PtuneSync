import { logger } from 'src/core/services/logger/loggerInstance';

/**
 * タグ表現と置換ロジック
 * - Obsidianタグ（#付き文字列）の正規化と比較処理を担当
 * - Replacementは renameTag 時の文字列置換ロジックを保持
 */

const TAG_PATTERN =
  /^#[^\u2000-\u206F\u2E00-\u2E7F'!"#$%&()*+,.:;<=>?@^`{|}~[\]\\\s]+$/;

export class Tag {
  readonly tag: string; // "#TagName"
  readonly name: string; // "TagName"
  readonly canonical: string; // "#tagname"
  readonly canonicalPrefix: string; // "#tagname/"
  readonly matches: (text: string) => boolean;

  constructor(name: string) {
    const hashed = Tag.toTag(name);
    this.tag = hashed;
    this.name = hashed.slice(1);
    this.canonical = hashed.toLowerCase();
    this.canonicalPrefix = this.canonical + '/';

    this.matches = (text: string): boolean => {
      const lower = text.toLowerCase();
      return lower === this.canonical || lower.startsWith(this.canonicalPrefix);
    };

    logger.debug(`[Tag] created: tag=${this.tag}, canonical=${this.canonical}`);
  }

  /** タグを文字列として返す */
  toString(): string {
    return this.tag;
  }

  /** 与えられた文字列が有効なタグか判定 */
  static isTag(s: string): boolean {
    const valid = TAG_PATTERN.test(s);
    logger.debug(`[Tag.isTag] input=${s}, valid=${valid}`);
    return valid;
  }

  /** "#tag" 形式に正規化 */
  static toTag(name: string): string {
    while (name.startsWith('##')) name = name.slice(1);
    const result = name.startsWith('#') ? name : '#' + name;
    logger.debug(`[Tag.toTag] input=${name}, result=${result}`);
    return result;
  }

  /** "#" を除いたタグ名を取得 */
  static toName(tag: string): string {
    const result = this.toTag(tag).slice(1);
    logger.debug(`[Tag.toName] input=${tag}, result=${result}`);
    return result;
  }

  /** 小文字正規化 */
  static canonical(name: string): string {
    const result = Tag.toTag(name).toLowerCase();
    logger.debug(`[Tag.canonical] input=${name}, result=${result}`);
    return result;
  }
}
