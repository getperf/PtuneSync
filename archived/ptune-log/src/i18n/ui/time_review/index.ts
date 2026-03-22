// src/i18n/domain/time_review/index.ts

import type { Lang } from '../../types';
import { timeReviewJa } from './ja';
import { timeReviewEn } from './en';

export function getTimeReviewI18n(lang: Lang) {
  switch (lang) {
    case 'en':
      return timeReviewEn;
    case 'ja':
    default:
      return timeReviewJa;
  }
}

export type TimeReviewI18n = ReturnType<typeof getTimeReviewI18n>;
