// src/features/tag_merge/models/viewmodels/TagMergeGroupVM.ts

import { TagStat } from 'src/core/models/tags/TagStat';
import { TagMergeRowVM } from './TagMergeRowVM';

export type TagMergeGroupDisplayMode = 'normal' | 'toOnly';

export class TagMergeGroupVM {
  to: string;
  toStat: TagStat;
  readonly displayMode: TagMergeGroupDisplayMode;
  readonly rows: TagMergeRowVM[];

  // --- UI state ---
  checked: boolean;

  constructor(params: {
    to: string;
    toStat: TagStat;
    displayMode: TagMergeGroupDisplayMode;
    checked: boolean;
    rows: TagMergeRowVM[];
  }) {
    this.to = params.to;
    this.toStat = params.toStat;
    this.displayMode = params.displayMode;
    this.checked = params.checked;
    this.rows = params.rows;
  }

  /** to checkbox → from rows 一括反映 */
  setChecked(checked: boolean): void {
    this.checked = checked;
    for (const row of this.rows) {
      row.setChecked(checked);
    }
  }

  /** 表示対象 row */
  getVisibleRows(): TagMergeRowVM[] {
    return this.rows.filter((r) => !r.isSelf());
  }

  /** group 編集：配下 row の to を一括変更 */
  setTo(newTo: string, newToStat?: TagStat): void {
    this.to = newTo;

    if (newToStat) {
      this.toStat = newToStat;
    }

    for (const row of this.rows) {
      row.setTo(newTo);
    }
  }
}
