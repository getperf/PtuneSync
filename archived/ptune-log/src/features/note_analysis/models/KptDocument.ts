// src/features/note_analysis/models/KptDocument.ts
import { KptNode } from './KptNode';

export interface KptDocument {
  keep: KptNode[];
  problem: KptNode[];
  try: KptNode[];
}
