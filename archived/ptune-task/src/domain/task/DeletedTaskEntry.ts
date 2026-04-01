// src/task-io/models/DeletedTaskEntry.ts

export interface DeletedTaskEntry {
  id: string;              // Google Task ID
  compositeKey: string;    // 親__子
  parentTitle: string | null;
  title: string;
}
