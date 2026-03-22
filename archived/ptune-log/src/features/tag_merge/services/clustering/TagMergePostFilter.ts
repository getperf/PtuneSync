// src/features/tag_merge/services/clustering/TagMergePostFilter.ts

import { TagMergeCluster } from '../../models/domain/TagMergeCluster';

/**
 * TagMergePostFilter
 * - ClusterBuilder 後の結果に対する後処理フィルタ
 * - 評価軸（priority / to）は変更しない
 */
export class TagMergePostFilter {
  /**
   * from が未登録のメンバーのみを残す
   * - members が空になった cluster は除外
   */
  static filterUnregisteredOnly(
    clusters: TagMergeCluster[],
  ): TagMergeCluster[] {
    return clusters
      .map((cluster) => {
        const members = cluster.members.filter((m) => m.tag.isUnregistered);

        return {
          ...cluster,
          members,
        };
      })
      .filter((cluster) => cluster.members.length > 0);
  }
}
