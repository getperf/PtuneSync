// src/i18n/ui/common/index.ts

import type { UiCommonI18n } from './schema';
import { UI_COMMON_JA } from './ja';
import { UI_COMMON_EN } from './en';
import type { Lang } from '../../types';

export function getUiCommonI18n(lang: Lang): UiCommonI18n {
  switch (lang) {
    case 'en':
      return UI_COMMON_EN;
    case 'ja':
    default:
      return UI_COMMON_JA;
  }
}

export type { UiCommonI18n };
