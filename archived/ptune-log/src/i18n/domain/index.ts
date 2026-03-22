// src/i18n/domain/index.ts
import type { Lang } from '../types';
import { getDailyNoteI18n } from './daily_note';

export function getDomainI18n(lang: Lang) {
  return {
    daily_note: getDailyNoteI18n(lang),
  };
}

export type DomainI18n = ReturnType<typeof getDomainI18n>;
