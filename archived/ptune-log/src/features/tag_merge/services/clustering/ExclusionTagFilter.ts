// src/features/tag_merge/services/ExclusionTagFilter.ts

import { TagCluster } from 'src/core/services/tag_clustering/models/TagCluster';
import { TagStatResolver } from 'src/core/services/tags/TagStatResolver';

export interface ExclusionResult {
  toKey: string;
  fromKey: string;
  reason: string;
}

export interface ExclusionTagFilterOptions {
  unregisteredOnly?: boolean;
  excludeIfClusterSizeAtLeast?: number;
}

export class ExclusionTagFilter {
  constructor(
    private readonly statResolver: TagStatResolver,
    private readonly options: ExclusionTagFilterOptions = {}
  ) { }

  /**
   * クラスタを走査し、除外対象を取り除いた TagCluster を返す
   */
  filter(
    clusters: TagCluster[]
  ): { filtered: TagCluster[]; excluded: ExclusionResult[] } {
    const excluded: ExclusionResult[] = [];
    const filtered: TagCluster[] = [];

    for (const cluster of clusters) {
      const clusterSize = cluster.members.length;

      // クラスタ全体除外条件
      if (
        this.options.excludeIfClusterSizeAtLeast !== undefined &&
        clusterSize >= this.options.excludeIfClusterSizeAtLeast
      ) {
        for (const m of cluster.members) {
          excluded.push({
            toKey: cluster.representative.key,
            fromKey: m.key,
            reason: 'cluster_too_large',
          });
        }
        continue;
      }

      const members = [];

      for (const member of cluster.members) {
        if (this.options.unregisteredOnly) {
          const stat = this.statResolver.resolve(member.key);
          if (!stat.isUnregistered) {
            excluded.push({
              toKey: cluster.representative.key,
              fromKey: member.key,
              reason: 'registered_tag',
            });
            continue;
          }
        }

        members.push(member);
      }

      if (members.length > 0) {
        filtered.push({
          ...cluster,
          members,
        });
      }
    }

    return { filtered, excluded };
  }
}
