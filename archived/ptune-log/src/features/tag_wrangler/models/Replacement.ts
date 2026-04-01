import { Tag } from './Tag';
import { logger } from 'src/core/services/logger/loggerInstance';

/**
 * タグ置換ロジック
 * - inString: 文字列中の単一タグ置換
 * - inArray: 配列内のタグ・エイリアス置換
 * - willMergeTags: リネーム先が既存タグと衝突するかを検出
 */
export class Replacement {
  private cache: Record<string, string> = {};

  constructor(private fromTag: Tag, private toTag: Tag) {
    this.cache = {
      [fromTag.tag]: toTag.tag,
      [fromTag.name]: toTag.name,
    };
    logger.debug(
      `[Replacement.constructor] from=${fromTag.tag} → to=${toTag.tag}`
    );
  }

  /**
   * 文字列内のタグを置換
   */
  inString(text: string, pos = 0): string {
    const result =
      text.slice(0, pos) +
      this.toTag.tag +
      text.slice(pos + this.fromTag.tag.length);
    logger.debug(
      `[Replacement.inString] replaced="${this.fromTag.tag}" → "${this.toTag.tag}"`
    );
    return result;
  }

  /**
   * 配列（タグリストなど）内のタグ置換
   * @param tags 対象配列
   * @param skipOdd 区切りトークンをスキップする場合 true
   * @param isAlias alias フィールドかどうか
   */
  inArray(tags: any[], skipOdd = false, isAlias = false): any[] {
    logger.debug(
      `[Replacement.inArray] start: total=${tags.length}, skipOdd=${skipOdd}, isAlias=${isAlias}`
    );
    const result = tags.map((t, i) => {
      if (skipOdd && i & 1) return t; // 区切りをスキップ
      if (!t || typeof t !== 'string') return t;

      if (isAlias) {
        if (!t.startsWith('#') || !Tag.isTag(t)) return t;
      } else if (/[ ,\n]/.test(t)) {
        return this.inArray(t.split(/([, \n]+)/), true).join('');
      }

      if (this.cache[t]) return this.cache[t];

      const lower = t.toLowerCase();
      if (this.cache[lower]) {
        return (this.cache[t] = this.cache[lower]);
      }

      if (lower.startsWith(this.fromTag.canonicalPrefix)) {
        return (this.cache[t] = this.cache[lower] = this.inString(t));
      }

      if (('#' + lower).startsWith(this.fromTag.canonicalPrefix)) {
        return (this.cache[t] = this.cache[lower] =
          this.inString('#' + t).slice(1));
      }

      return (this.cache[t] = this.cache[lower] = t);
    });

    logger.debug(`[Replacement.inArray] completed: updated=${result.length}`);
    return result;
  }

  /**
   * リネーム時に既存タグと衝突するか判定
   * @param tagNames Vault中の全タグ名リスト
   * @returns [originTag, clashingTag] または undefined
   */
  willMergeTags(tagNames: string[]): [Tag, Tag] | undefined {
    if (this.fromTag.canonical === this.toTag.canonical) return;

    const existing = new Set(tagNames.map((s) => s.toLowerCase()));
    for (const tagName of tagNames.filter(this.fromTag.matches)) {
      const changed = this.inString(tagName);
      if (existing.has(changed.toLowerCase())) {
        logger.debug(
          `[Replacement.willMergeTags] conflict: ${tagName} → ${changed}`
        );
        return [new Tag(tagName), new Tag(changed)];
      }
    }

    logger.debug('[Replacement.willMergeTags] no conflict detected');
    return undefined;
  }
}
