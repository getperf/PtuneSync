import { TagAliases } from 'src/core/models/tags/TagAliases';

export type NormalizedTags = {
  normalized: string[];
  newTags: string[];
};

export class TagNormalizationService {
  /**
   * バッチ正規化（既存仕様）
   * - ノート解析／LLM 結果用
   */
  normalize(tags: unknown, aliases: TagAliases): NormalizedTags {
    if (!Array.isArray(tags)) {
      return { normalized: [], newTags: [] };
    }

    return aliases.normalizeAndRegisterWithDiff(tags);
  }

  /**
   * 単一タグ正規化（UI編集用）
   * @returns 正規化後タグ名と既存タグかどうか
   */
  normalizeSingle(
    tag: string,
    aliases: TagAliases
  ): { normalized: string; isNew: boolean } {
    const input = tag.trim();
    if (!input) {
      return { normalized: input, isNew: true };
    }

    const { normalized, newTags } = aliases.normalizeAndRegisterWithDiff([
      input,
    ]);

    const normalizedTag = normalized[0] ?? input;
    const isNew = newTags.includes(normalizedTag);

    return { normalized: normalizedTag, isNew };
  }
}
