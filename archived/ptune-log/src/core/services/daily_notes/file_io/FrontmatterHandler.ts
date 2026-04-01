// src/core/services/daily_notes/file_io/FrontmatterHandler.ts

export interface FrontmatterResult {
  frontmatter?: string;
  body: string;
}

export class FrontmatterHandler {
  static split(markdown: string): FrontmatterResult {
    const lines = markdown.split('\n');

    // 先頭行が '---' でなければ frontmatter なし
    if (lines[0].trim() !== '---') {
      return { body: markdown };
    }

    // 終端の '---' を探す（2行目以降、行頭のみ）
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '---') {
        const frontmatter = lines
          .slice(0, i + 1)
          .join('\n')
          .trimEnd();
        const body = lines
          .slice(i + 1)
          .join('\n')
          .trimStart();
        return { frontmatter, body };
      }
    }

    // 壊れた frontmatter（終端なし）は無視
    return { body: markdown };
  }

  static merge(frontmatter: string | undefined, body: string): string {
    if (!frontmatter) {
      return body;
    }
    return `${frontmatter}\n\n${body}`;
  }
}
