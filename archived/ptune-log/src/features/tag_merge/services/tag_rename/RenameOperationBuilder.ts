// src/features/tag_merge/services/tag_rename/RenameOperationBuilder.ts

import { RenameOperation } from './models/RenameOperation';
import { RenameOperationRow } from './models/RenameOperationRow';

export class RenameOperationBuilder {
  build(rows: RenameOperationRow[]): RenameOperation {
    return {
      rows,
      executedCount: 0,
      failedRows: [],
    };
  }
}
