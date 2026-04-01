// src/core/services/tags/TagStatResolver.ts

import { Tags } from 'src/core/models/tags/Tags';
import { TagAliases } from 'src/core/models/tags/TagAliases';
import { TagStat } from 'src/core/models/tags/TagStat';

/**
 * TagStatResolver
 * - 件数は Tags を正とする
 * - 未登録判定は Tags / TagAliases のみで決定
 */
export class TagStatResolver {
  constructor(
    private readonly tags: Tags,
    private readonly aliases?: TagAliases,
  ) {}

  resolve(key: string): TagStat {
    const count = this.tags.getCount(key) ?? 0;

    const isUnregistered =
      // ルール1: Tags に存在しない
      !this.existsInTags(key) ||
      // ルール2: Alias が unchecked
      this.isAliasUnchecked(key);

    return {
      key,
      count,
      isUnregistered,
    };
  }

  /** Tags に存在するか（has() が無いため getCount ベース） */
  private existsInTags(key: string): boolean {
    return this.tags.getCount(key) !== undefined;
  }

  /**
   * エイリアス辞書に存在し、unchecked の場合 true
   * - エイリアスが無い場合は false
   */
  private isAliasUnchecked(key: string): boolean {
    if (!this.aliases) return false;

    const alias = this.aliases.get(key);

    if (!alias || alias.isDeleted) return false;

    return alias.checked === false;
  }
}
