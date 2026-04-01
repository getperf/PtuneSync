// src/features/daily_review/services/note_summary/prompts/index.ts

import type { Lang } from 'src/i18n/types';
import { i18n } from 'src/i18n';
import { SENTENCE_SUMMARY_SYSTEM_PROMPT_JA } from './ja';
import { SENTENCE_SUMMARY_SYSTEM_PROMPT_EN } from './en';

export function buildSentenceSummarySystemPrompt(lang?: Lang): string {
  const resolvedLang: Lang = lang ?? i18n.lang ?? 'ja';

  switch (resolvedLang) {
    case 'en':
      return SENTENCE_SUMMARY_SYSTEM_PROMPT_EN;
    case 'ja':
    default:
      return SENTENCE_SUMMARY_SYSTEM_PROMPT_JA;
  }
}
