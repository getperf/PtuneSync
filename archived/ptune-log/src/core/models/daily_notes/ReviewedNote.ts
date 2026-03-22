// src/core/models/daily_notes/reviews/ReviewedNote.ts

type ReviewLineType =
  | 'REJECTED' // ユーザが否定・違和感を示した
  | 'ACCEPTED' // ユーザが否定しなかった（暫定的に受容）
  | 'USERCOMMENT';

export interface ReviewLine {
  type: ReviewLineType;
  text: string;
}

export class ReviewedNote {
  constructor(
    public readonly path: string,
    public readonly title: string,
    public readonly lines: ReviewLine[]
  ) {}

  isEmpty(): boolean {
    return this.lines.length === 0;
  }
}
