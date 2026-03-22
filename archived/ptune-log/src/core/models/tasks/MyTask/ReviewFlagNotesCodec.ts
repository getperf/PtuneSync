// File: src/core/models/tasks/MyTask/ReviewFlagNotesCodec.ts
import { ReviewFlag } from './ReviewFlag';

export class ReviewFlagNotesCodec {
  private static readonly _pattern = /#ptune:review=([^\s]+)/;

  /** notes → reviewFlags(Set) */
  static decode(notes?: string): Set<ReviewFlag> {
    if (!notes) return new Set<ReviewFlag>();

    const match = notes.match(this._pattern);
    if (!match) return new Set<ReviewFlag>();

    const raw = match[1] ?? '';
    const flags = raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    return new Set<ReviewFlag>(flags);
  }

  /** reviewFlags → notes 用文字列（Iterable を受ける） */
  static encode(flags: Iterable<ReviewFlag>): string {
    const uniq = Array.from(new Set(flags));
    return `#ptune:review=${uniq.join(',')}`;
  }

  /** notes から review 部分を除去 */
  static strip(notes?: string): string | undefined {
    if (!notes) return notes;
    const stripped = notes.replace(this._pattern, '').trim();
    return stripped.length > 0 ? stripped : undefined;
  }
}
