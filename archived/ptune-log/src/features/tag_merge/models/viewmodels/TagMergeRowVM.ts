// src/features/tag_merge/models/viewmodels/TagMergeRowVM.ts

import { TagStat } from 'src/core/models/tags/TagStat';

export class TagMergeRowVM {
  readonly from: string;
  to: string;
  readonly count: number;
  readonly fromStat: TagStat;

  // --- UI state ---
  checked: boolean;

  constructor(params: {
    from: string;
    to: string;
    count: number;
    checked: boolean;
    fromStat: TagStat;
  }) {
    this.from = params.from;
    this.to = params.to;
    this.count = params.count;
    this.checked = params.checked;
    this.fromStat = params.fromStat;
  }

  setChecked(checked: boolean): void {
    this.checked = checked;
  }

  setTo(newTo: string): void {
    this.to = newTo;
  }

  isSelf(): boolean {
    return this.from === this.to;
  }
}
