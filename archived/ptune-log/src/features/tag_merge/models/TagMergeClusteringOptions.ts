// features/tag_merge/models/TagMergeClusteringOptions.ts

export interface TagMergeClusteringOptions {
  k: number;
  iterations: number;
  totalTagCount?: number;

  exclusion: {
    unregisteredOnly: boolean;
    excludeIfClusterSizeAtLeast?: number;
    unregisteredCount?: number;
  };

  priority: {
    largeClusterThreshold: number;
  };
}
