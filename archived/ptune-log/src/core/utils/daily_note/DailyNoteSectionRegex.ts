// src/core/services/daily_notes/DailyNoteSectionRegex.ts

export class DailyNoteSectionRegex {
  /** ## / ### のみをセクション境界として扱う */
  static isSectionBoundary(line: string): boolean {
    const m = line.match(/^(#{2,})\s+/);
    if (!m) return false;

    const level = m[1].length;
    return level === 2 || level === 3;
  }

  /** 見出しテキスト抽出（非見出しは null） */
  static extractHeadingText(line: string): string | null {
    const m = line.match(/^(#{1,6})\s+(.*)$/);
    return m ? m[2].trim() : null;
  }
}
