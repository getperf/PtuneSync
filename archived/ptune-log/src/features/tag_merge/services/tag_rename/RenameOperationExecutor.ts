// src/features/tag_merge/services/tag_rename/RenameOperationExecutor.ts

import { RenameOperation } from './models/RenameOperation';
import { RenameOperationRow } from './models/RenameOperationRow';
import { TagRenamer } from 'src/features/tag_wrangler/services/TagRenamer';

export type RenameExecutionState = {
  total: number;
  executed: number;
  failed: number;
};

export class RenameOperationExecutor {
  constructor(private readonly renamer: TagRenamer) {}

  async execute(
    operation: RenameOperation,
    onProgress?: (state: RenameExecutionState) => void,
  ): Promise<void> {
    const total = operation.rows.length;
    let executed = 0;
    let failed = 0;

    for (const row of operation.rows) {
      try {
        await this.renamer.rename(row.from, row.to);
        executed++;
        operation.executedCount++;
      } catch {
        failed++;
        operation.failedRows.push(row);
      }

      onProgress?.({ total, executed, failed });
    }
  }
}
