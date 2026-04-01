// src/core/utils/markdown/MarkdownCommentBlock.ts

/**
 * MarkdownCommentBlock
 * - HTMLコメント（<!-- -->）の生成と一括除去を担当
 * - kind 等のメタ構造は扱わない
 */
export class MarkdownCommentBlock {
  /**
   * コメントブロックを生成
   */
  static build(lines: string | readonly string[]): string {
    const body =
      typeof lines === 'string'
        ? lines
        : lines.join('\n');

    return `
<!--
${body}
-->
`.trim();
  }

  /**
   * すべての HTML コメントブロックを除去
   */
  static removeAll(raw: string): string {
    const withoutComments = raw.replace(
      /<!--[\s\S]*?-->/gm,
      ''
    );

    // 空行を正規化（3行以上 → 2行）
    return withoutComments.replace(/\n{3,}/g, '\n\n').trim();
  }
}
