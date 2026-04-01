// File: src/core/services/llm/note_analysis/NoteLLMAnalyzer.ts

import { parseYaml } from 'obsidian';
import { LLMYamlExtractor } from './LLMYamlExtractor';
import { LLMClient } from 'src/core/services/llm/client/LLMClient';

export type LLMTagObject = {
  name: string;
  evidence?: string;
};

export type NoteAnalysisResult = {
  summary?: string;

  /**
   * 下流（TagAliases 等）向けに「文字列タグのみ」に正規化した配列。
   * LLMが tags を object 配列で返してもここで吸収する。
   */
  tags?: string[];

  /**
   * 証拠(evidence)付きのタグ（UI/振り返り用途）。
   * 旧仕様（string[]）のときは undefined のまま。
   */
  tagObjects?: LLMTagObject[];

  /**
   * YAMLをそのまま保持（デバッグ・将来拡張用）
   */
  raw: Record<string, unknown>;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function toOptionalString(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

function parseTagObjects(tagsValue: unknown): LLMTagObject[] | undefined {
  if (!Array.isArray(tagsValue)) return undefined;

  const out: LLMTagObject[] = [];
  for (const t of tagsValue) {
    if (!isRecord(t)) continue;

    const name = toOptionalString(t.name);
    if (!name) continue;

    const evidence = toOptionalString(t.evidence);
    out.push({ name, evidence });
  }

  return out.length > 0 ? out : undefined;
}

function parseStringTags(tagsValue: unknown): string[] | undefined {
  if (!Array.isArray(tagsValue)) return undefined;

  const out = tagsValue.filter((t): t is string => typeof t === 'string');
  return out.length > 0 ? out : undefined;
}

export class NoteLLMAnalyzer {
  constructor(
    private readonly client: LLMClient,
    private readonly extractor: LLMYamlExtractor
  ) {}

  async analyze(content: string, prompt: string): Promise<NoteAnalysisResult> {
    const llmText = await this.client.complete(prompt, content);
    if (!llmText) throw new Error('LLM応答が空');

    const yamlText = this.extractor.extract(llmText);
    const parsed = parseYaml(yamlText);

    if (!isRecord(parsed)) {
      throw new Error('YAML解析失敗');
    }

    const summary = toOptionalString(parsed.summary);

    // 新仕様: tags: [{ name, evidence }]
    const tagObjects = parseTagObjects(parsed.tags);

    // 旧仕様: tags: ["分類/...", "主題/..."]
    // 新仕様でも tags(string[]) は下流互換のため必ず埋める
    const tags =
      tagObjects?.map((t) => t.name) ??
      parseStringTags(parsed.tags) ??
      undefined;

    return {
      summary,
      tags,
      tagObjects,
      raw: parsed,
    };
  }
}
