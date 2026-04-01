// src/features/tag_merge/services/tag_rename/models/RenameCandidateRow.ts
export type RenameCandidateRow = {
  from: string;
  to: string;
  priority: string; // TagMergePriorityKey 相当
};
