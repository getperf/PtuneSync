// src/i18n/ui/daily_review/index.ts

import type { Lang } from '../../types';
import { dailyReviewJa } from './ja';
import { dailyReviewEn } from './en';

export function getDailyReviewI18n(lang: Lang) {
  switch (lang) {
    case 'en':
      return dailyReviewEn;
    case 'ja':
    default:
      return dailyReviewJa;
  }
}

export type DailyReviewI18n = ReturnType<typeof getDailyReviewI18n>;
