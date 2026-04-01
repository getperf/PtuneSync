// src/i18n/ui/settings_review/index.ts

import type { Lang } from 'src/i18n/types';
import type { UiSettingsReviewI18n } from './schema';
import { UI_SETTINGS_REVIEW_JA } from './ja';
import { UI_SETTINGS_REVIEW_EN } from './en';

export function getUiSettingsReviewI18n(
  lang: Lang
): UiSettingsReviewI18n {
  switch (lang) {
    case 'en':
      return UI_SETTINGS_REVIEW_EN;
    case 'ja':
    default:
      return UI_SETTINGS_REVIEW_JA;
  }
}

export type { UiSettingsReviewI18n };
