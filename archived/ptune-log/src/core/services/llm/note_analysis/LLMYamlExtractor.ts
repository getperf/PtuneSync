// File: src/core/utils/file/LLMYamlExtractor.ts
/**
 * LLM出力から YAML コードブロックを安全に抽出する
 * ```yaml ... ``` または fallback 対応。
 */
export class LLMYamlExtractor {
  extract(raw: string): string {
    const match = raw.match(/```(?:yaml)?\s*([\s\S]*?)\s*```/);
    if (match) return match[1].trim();

    const trimmed = raw.trim();
    if (
      trimmed.startsWith('summary:') ||
      trimmed.startsWith('tags:') ||
      trimmed.startsWith('---')
    ) {
      return trimmed;
    }

    console.warn('[LLMYamlExtractor] YAML block not found or malformed');
    return '';
  }
}
