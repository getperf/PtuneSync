// File: src/features/google_tasks/services/time_analysis/models/RelatedNote.ts

export interface RelatedNote {
  /** 親フォルダ/タイトル（.md なし） */
  path: string;
  /** ノートのタグ（frontmatter.tags） */
  tags: string[];
}
