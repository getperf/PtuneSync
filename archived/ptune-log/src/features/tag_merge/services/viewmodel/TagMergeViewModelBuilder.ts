// src/features/tag_merge/services/viewmodel/TagMergeViewModelBuilder.ts

import { TagMergeCluster } from '../../models/domain/TagMergeCluster';
import {
  TagMergePriorityKey,
  TAG_MERGE_PRIORITIES,
} from '../../models/domain/TagMergePriority';
import { TagMergePriorityGroupVM } from '../../models/viewmodels/TagMergePriorityGroupVM';
import { TagMergeGroupVM } from '../../models/viewmodels/TagMergeGroupVM';
import { TagMergeRowVM } from '../../models/viewmodels/TagMergeRowVM';

/**
 * TagMergeViewModelBuilder
 * - TagMergeCluster → ViewModel(class)
 * - rows: fromStat.count 降順
 * - groups: toStat.count 降順（priority 内）
 * - low / other は既定チェック OFF
 *
 * NOTE:
 * - 表示制御・状態変更ロジックは ViewModel に集約
 * - Builder は生成と初期並び順のみを担当
 */
export class TagMergeViewModelBuilder {
  build(clusters: TagMergeCluster[]): TagMergePriorityGroupVM[] {
    const bucket: Record<TagMergePriorityKey, TagMergePriorityGroupVM> = {
      high: { priority: 'high', active: false, groups: [] },
      middle: { priority: 'middle', active: false, groups: [] },
      low: { priority: 'low', active: false, groups: [] },
      other: { priority: 'other', active: false, groups: [] },
    };

    for (const cluster of clusters) {
      const displayMode = cluster.priority === 'other' ? 'toOnly' : 'normal';
      const defaultChecked = this.getDefaultChecked(cluster.priority);

      // --- rows ---
      const rows = cluster.members.map(
        (m) =>
          new TagMergeRowVM({
            from: m.tag.key,
            to: cluster.to.key,
            count: m.tag.count,
            checked: defaultChecked,
            fromStat: m.tag,
          }),
      );

      // --- group ---
      const group = new TagMergeGroupVM({
        to: cluster.to.key,
        toStat: cluster.to,
        displayMode,
        checked: defaultChecked,
        rows: this.sortRowsByFromCountDesc(rows),
      });

      bucket[cluster.priority].groups.push(group);
    }

    // priority 内の並び替え（既存仕様）
    for (const pg of Object.values(bucket)) {
      pg.groups = this.sortGroupsByToCountDesc(pg.groups);
    }

    // priority の並び替え（既存仕様）
    return Object.values(bucket).sort(
      (a, b) =>
        (TAG_MERGE_PRIORITIES.get(a.priority)?.order ?? 999) -
        (TAG_MERGE_PRIORITIES.get(b.priority)?.order ?? 999),
    );
  }

  /** low / other は既定チェック OFF */
  private getDefaultChecked(priority: TagMergePriorityKey): boolean {
    return priority !== 'low' && priority !== 'other';
  }

  /** rows: fromStat.count 降順 */
  private sortRowsByFromCountDesc(rows: TagMergeRowVM[]): TagMergeRowVM[] {
    return [...rows].sort((a, b) => b.fromStat.count - a.fromStat.count);
  }

  /** groups: toStat.count 降順 */
  private sortGroupsByToCountDesc(
    groups: TagMergeGroupVM[],
  ): TagMergeGroupVM[] {
    return [...groups].sort((a, b) => b.toStat.count - a.toStat.count);
  }
}
