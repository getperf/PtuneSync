import { TagAliases, TagAliasRow } from 'src/core/models/tags/TagAliases';
import { Tags } from 'src/core/models/tags/Tags';
import { logger } from 'src/core/services/logger/loggerInstance';

import { normalizeTagForCompare } from 'src/core/utils/tag/normalizeTag';

export interface TagAliasPair {
  from: string; // 未マージタグ
  to: string; // 既存代表タグ
  kind: string;
  checked: boolean;
}

export interface TagAliasResolveResult {
  pairs: TagAliasPair[]; // From → To の対応
  unmerged: TagAliasPair[]; // マージ対象なし
}

/**
 * タグエイリアスのクラスタリングと From→To ペア生成クラス
 * - タグの正規化キー(tagKey)を用いてクラスタ化
 * - 出現数(count)に基づき代表タグを決定
 */
export class TagAliasResolver {
  /**
   * タグクラスタを解析し、エイリアスペアを生成
   * checked=false のタグを対象（includeChecked=true で全件対象）
   */
  resolve(
    aliases: TagAliases,
    tags: Tags,
    includeChecked = false
  ): TagAliasResolveResult {
    const all = aliases.getAll();
    const unchecked = all.filter((a) => !a.checked && !a.isDeleted);
    const targetAliases = includeChecked ? all : unchecked;

    logger.debug(
      `[TagAliasResolver.resolve] start includeChecked=${includeChecked} total=${all.length}`
    );

    // --- 正規化キーを付与
    for (const alias of all) {
      alias.tagKey = normalizeTagForCompare(alias.aliasName);
    }

    const clusters = new Map<string, TagAliasRow[]>();

    for (const alias of targetAliases) {
      const key = alias.tagKey;
      if (!key) continue;

      const cluster = all.filter((r) => r.tagKey === key && !r.isDeleted);
      if (cluster.length === 0) continue;

      // --- 出現数の多いタグを代表とする
      const mainTag = cluster
        .map((r) => ({
          name: r.aliasName,
          count: tags.getCount(r.aliasName) ?? 0,
        }))
        .sort((a, b) => b.count - a.count)[0];

      for (const row of cluster) {
        row.tagName = mainTag?.name ?? row.aliasName;
      }

      clusters.set(key, cluster);
    }

    logger.debug(`[TagAliasResolver.resolve] clusters=${clusters.size}`);

    // --- From → To 構造を構築
    const pairs: TagAliasPair[] = [];
    const unmerged: TagAliasPair[] = [];

    for (const cluster of clusters.values()) {
      if (cluster.length < 2) {
        const only = cluster[0];
        unmerged.push({
          from: only.aliasName,
          to: only.aliasName,
          kind: only.tagKind,
          checked: !only.isDeleted,
        });
        continue;
      }

      const main = cluster[0].tagName;
      for (const row of cluster) {
        if (row.aliasName === main) continue;
        pairs.push({
          from: row.aliasName,
          to: main,
          kind: row.tagKind,
          checked: !row.isDeleted,
        });
      }
    }

    logger.info(
      `[TagAliasResolver.resolve] complete pairs=${pairs.length}, unmerged=${unmerged.length}`
    );
    return { pairs, unmerged };
  }
}
