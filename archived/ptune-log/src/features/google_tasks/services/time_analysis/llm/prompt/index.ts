// File: src/features/google_tasks/services/time_analysis/llm/prompt/index.ts
import type { Lang } from 'src/i18n/types';
import { i18n } from 'src/i18n';
import { buildTimeAnalysisPromptJa } from './ja';
import { buildTimeAnalysisPromptEn } from './en';

export interface TimeAnalysisPromptParams {
  yamlText: string;
  header: string;
}

export function buildTimeAnalysisPrompt(params: TimeAnalysisPromptParams, lang?: Lang): string {
  const resolvedLang: Lang = lang ?? i18n.lang ?? 'ja';

  switch (resolvedLang) {
    case 'en':
      return buildTimeAnalysisPromptEn(params);
    case 'ja':
    default:
      return buildTimeAnalysisPromptJa(params);
  }
}
