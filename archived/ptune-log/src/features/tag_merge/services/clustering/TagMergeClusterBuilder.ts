// src/features/tag_merge/services/TagMergeClusterBuilder.ts

import { TagCluster } from 'src/core/services/tag_clustering/models/TagCluster';
import { TagStatResolver } from 'src/core/services/tags/TagStatResolver';
import { TagMergeCluster } from '../../models/domain/TagMergeCluster';
import { TagMergePriorityResolver } from '../priority/TagMergePriorityResolver';

type ClusterKey = string;

export type TagMergeClusterBuildResult = {
  clusters: TagMergeCluster[];
  debugText: string;
};

export class TagMergeClusterBuilder {
  constructor(
    private readonly statResolver: TagStatResolver,
    private readonly priorityResolver: TagMergePriorityResolver,
  ) {}

  build(clusters: TagCluster[]): TagMergeClusterBuildResult {
    const grouped = new Map<ClusterKey, TagMergeCluster>();

    // デバッグ集計用
    const debugMap = new Map<
      string,
      Array<{ from: string; priority: string }>
    >();

    for (const cluster of clusters) {
      const toKey = cluster.representative.key;
      const toStat = this.statResolver.resolve(toKey);
      const clusterSize = cluster.members.length;

      for (const member of cluster.members) {
        const fromKey = member.key;
        const fromStat = this.statResolver.resolve(fromKey);

        const priority = this.priorityResolver.resolve(
          clusterSize,
          toKey,
          fromKey,
        );

        // ---- 本処理 ----
        const key = this.buildGroupKey(toKey, priority);
        let group = grouped.get(key);
        if (!group) {
          group = {
            to: toStat,
            priority,
            members: [],
          };
          grouped.set(key, group);
        }
        group.members.push({ tag: fromStat });

        // ---- デバッグ集計 ----
        const list = debugMap.get(toKey) ?? [];
        list.push({ from: fromKey, priority });
        debugMap.set(toKey, list);
      }
    }

    return {
      clusters: Array.from(grouped.values()),
      debugText: this.buildDebugText(debugMap),
    };
  }

  private buildGroupKey(toKey: string, priority: string): ClusterKey {
    return `${priority}::${toKey}`;
  }

  /**
   * デバッグ用テキスト生成
   *
   * to
   *   from(priority)
   */
  private buildDebugText(
    map: Map<string, Array<{ from: string; priority: string }>>,
  ): string {
    const blocks: string[] = [];

    for (const [to, members] of map.entries()) {
      const lines = members
        .filter((m) => m.from !== to)
        .map((m) => `\t${m.from}(${m.priority})`);

      if (lines.length === 0) continue;

      blocks.push([to, ...lines].join('\n'));
    }

    return blocks.join('\n\n');
  }
}
