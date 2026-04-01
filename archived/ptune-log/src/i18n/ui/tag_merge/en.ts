// src/i18n/ui/tag_merge/en.ts

import { TagMergePriorityKey } from 'src/features/tag_merge/models/domain/TagMergePriority';

export const tagMergeEn = {
  phase: {
    prepare: 'Tag Merge (Ready)',
    clustering: 'Clustering in progress',
    reviewMerge: 'Clustering complete, reviewing merge candidates',
    updateMerge: 'Applying tag merges',
    complete: 'Tag merge complete',
  },

  action: {
    runClustering: 'Run clustering',
    runTagMerge: 'Run tag merge',
  },

  priority: {
    high: 'High',
    middle: 'Middle',
    low: 'Low',
    other: 'Other',
  } satisfies Record<TagMergePriorityKey, string>,

  status: {
    clustering: 'Clustering is running…',
    mergePending: 'Tag merge is not implemented yet',
    error: 'An error occurred',
  },
};
