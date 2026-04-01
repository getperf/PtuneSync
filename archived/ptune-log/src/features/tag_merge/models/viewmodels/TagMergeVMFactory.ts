// src/features/tag_merge/models/viewmodels/TagMergeVMFactory.ts

import { TagMergeGroupVM } from './TagMergeGroupVM';
import { TagMergeRowVM } from './TagMergeRowVM';
import { TagStat } from 'src/core/models/tags/TagStat';

export class TagMergeVMFactory {
  static createRow(params: {
    from: string;
    to: string;
    count: number;
    checked: boolean;
    fromStat: TagStat;
  }): TagMergeRowVM {
    return new TagMergeRowVM(params);
  }

  static createGroup(params: {
    to: string;
    toStat: TagStat;
    displayMode: 'normal' | 'toOnly';
    checked: boolean;
    rows: TagMergeRowVM[];
  }): TagMergeGroupVM {
    return new TagMergeGroupVM(params);
  }
}
