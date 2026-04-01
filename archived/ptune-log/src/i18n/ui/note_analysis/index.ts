// src/i18n/ui/daily_review/index.ts

import { noteAnalysisJa } from './ja';
import { noteAnalysisEn } from './en';
import { Lang } from 'src/i18n/types';

export function getNoteAnalysisI18n(lang: Lang) {
  switch (lang) {
    case 'en':
      return noteAnalysisEn;
    case 'ja':
    default:
      return noteAnalysisJa;
  }
}

export type NoteAnalysisI18n = ReturnType<typeof getNoteAnalysisI18n>;
