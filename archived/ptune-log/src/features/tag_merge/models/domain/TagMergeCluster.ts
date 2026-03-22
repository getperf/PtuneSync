// src/features/tag_merge/models/TagMergeCluster.ts

import { TagMergePriorityKey } from './TagMergePriority';
import { TagStat } from 'src/core/models/tags/TagStat';

export interface TagMergeMember {
  tag: TagStat;
}

export interface TagMergeCluster {
  to: TagStat;
  members: TagMergeMember[];
  priority: TagMergePriorityKey;
}
