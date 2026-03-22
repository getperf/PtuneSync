// src/features/tag_merge/models/TagMergePriority.ts

/**
 * 優先度キー（i18n key / 内部識別子）
 * - enum にしない（i18n を単純化）
 */
export type TagMergePriorityKey =
  | 'high'
  | 'middle'
  | 'low'
  | 'other';

/**
 * UI 表示・並び順・説明をまとめた定義
 */
export const TAG_MERGE_PRIORITIES: Map<
  TagMergePriorityKey,
  {
    labelKey: string; // i18n key
    order: number;   // 表示順（小さいほど上）
  }
> = new Map([
  ['high', { labelKey: 'tagMerge.priority.high', order: 1 }],
  ['middle', { labelKey: 'tagMerge.priority.middle', order: 2 }],
  ['low', { labelKey: 'tagMerge.priority.low', order: 3 }],
  ['other', { labelKey: 'tagMerge.priority.other', order: 99 }],
]);
