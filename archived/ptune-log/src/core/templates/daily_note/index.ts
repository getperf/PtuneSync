// src/core/templates/daily_note/index.ts

import type { Lang } from 'src/i18n/types';
import { i18n } from 'src/i18n';
import { buildDailyNoteTemplateJa } from './ja';
import { buildDailyNoteTemplateEn } from './en';

export function buildDailyNoteTemplate(lang?: Lang): string {
  const resolvedLang: Lang = lang ?? i18n.lang ?? 'ja';

  switch (resolvedLang) {
    case 'en':
      return buildDailyNoteTemplateEn();
    case 'ja':
    default:
      return buildDailyNoteTemplateJa();
  }
}
