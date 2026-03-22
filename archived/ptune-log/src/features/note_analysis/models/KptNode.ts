// src/features/note_analysis/models/KptNode.ts
export interface KptNode {
  id: string;
  text: string;
  children: KptNode[];
}
