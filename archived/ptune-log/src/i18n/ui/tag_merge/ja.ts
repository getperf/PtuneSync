// src/i18n/ui/tag_merge/ja.ts

import { TagMergePriorityKey } from 'src/features/tag_merge/models/domain/TagMergePriority';

export const tagMergeJa = {
  phase: {
    prepare: 'タグマージ（実行準備）',
    clustering: 'クラスタリング実行中',
    reviewMerge: 'クラスタリング完了、タグマージレビュー中',
    updateMerge: 'タグマージ適用中',
    complete: 'タグマージ完了',
  },

  action: {
    runClustering: 'クラスタ分析を実行',
    runTagMerge: 'タグマージ実行',
  },

  priority: {
    high: '高',
    middle: '中',
    low: '低',
    other: '除外',
  } satisfies Record<TagMergePriorityKey, string>,

  /**
   * status は今回 UI で未使用でもよいが、
   * エラーや将来のメッセージ用途として残す
   */
  status: {
    clustering: 'クラスタリング処理中です…',
    mergePending: 'タグマージ処理は未実装です',
    error: 'エラーが発生しました',
  },
};
