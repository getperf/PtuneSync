import { OutlineHeading } from './OutlineHeading';

export class OutlineContents {
  constructor(
    public headings: OutlineHeading[],
    public start: number, // index (0-based)
    public end: number // index (inclusive)
  ) {}

  setSelectionRange(start: number, end: number) {
    this.start = start;
    this.end = end;
  }

  getSelectedHeadings(): OutlineHeading[] {
    return this.headings.slice(this.start, this.end + 1);
  }

  incrementLevel(): void {
    this.getSelectedHeadings().forEach((h) => {
      h.level = Math.min(h.level + 1, 6);
    });
  }

  decrementLevel(): void {
    this.getSelectedHeadings().forEach((h) => {
      h.level = Math.max(h.level - 1, 1);
    });
  }

  toList(): string[] {
    return this.headings.map((h) => {
      const indent = '  '.repeat(h.level - 1); // レベル1→0インデント、レベル2→2スペース…
      return `${indent}- ${h.text}`;
    });
  }
}
