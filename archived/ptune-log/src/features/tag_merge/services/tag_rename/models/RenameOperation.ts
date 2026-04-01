// src/features/tag_merge/services/tag_rename/models/RenameOperation.ts

import { RenameOperationRow } from './RenameOperationRow';

export type RenameOperation = {
  /**
   * 実行対象の rename 行
   * - 事前に短縮・循環除外済み
   * - 実行順は rows の順序に従う
   */
  rows: RenameOperationRow[];

  /**
   * 実行済み件数
   * - Executor がインクリメントする
   */
  executedCount: number;

  /**
   * 失敗した rename 行
   * - 実行時エラーの記録用
   */
  failedRows: RenameOperationRow[];
};
