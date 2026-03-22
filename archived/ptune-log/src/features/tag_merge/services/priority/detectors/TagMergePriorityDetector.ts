// src/features/tag_merge/services/detectors/TagMergePriorityDetector.ts

export interface TagMergePriorityDetector {
  /**
   * ルールに該当する場合 true
   */
  detect(to: string, from: string): boolean;
}
