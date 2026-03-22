// src/features/daily_review/model/NoteSummaryDocument.ts

export type Sentence = {
  text: string;
};

export type NoteNode = {
  notePath: string;
  noteTitle: string;
  noteLink: string; // [[path|title]]
  sentences: Sentence[];
};

export type ProjectNode = {
  projectPath: string;
  projectTitle: string;
  notes: NoteNode[];
};

export type NoteSummaryDocument = {
  projects: ProjectNode[];
};
