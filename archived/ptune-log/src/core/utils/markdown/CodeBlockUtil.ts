// File: src/core/utils/markdown/CodeBlockUtil.ts

/**
 * Markdown のコードブロックを生成するユーティリティ
 *
 * @param content コードブロック内のテキスト
 * @param language ```text / ```yaml などの言語指定（省略可）
 */
export function wrapWithCodeBlock(content: string, language?: string): string {
  const lang = language ? language : '';
  return `\`\`\`${lang}\n${content}\n\`\`\``;
}
