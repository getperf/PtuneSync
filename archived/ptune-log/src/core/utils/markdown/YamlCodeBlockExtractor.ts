// src/core/utils/markdown/YamlCodeBlockExtractor.ts

export class YamlCodeBlockExtractor {
  /**
   * ```yaml ... ``` の最初のブロックを抽出
   */
  static extract(markdown: string): string | null {
    const match = markdown.match(/```yaml\s*([\s\S]*?)```/m);
    return match ? match[1].trim() : null;
  }
}
