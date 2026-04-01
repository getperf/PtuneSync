// src/features/daily_review/i18n/comments/index.ts

import type { Lang } from 'src/i18n/types';
import { i18n } from 'src/i18n';
import { jaTexts } from './ja';
import { enTexts } from './en';

export type TextKind = keyof typeof jaTexts;

const DICT = {
  ja: jaTexts,
  en: enTexts,
} as const;

export function getText(
  kind: TextKind,
  lang?: Lang
): string | readonly string[] {
  const resolvedLang: Lang = lang ?? i18n.lang ?? 'ja';

  switch (resolvedLang) {
    case 'en':
      return DICT.en[kind];
    case 'ja':
    default:
      return DICT.ja[kind];
  }
}
