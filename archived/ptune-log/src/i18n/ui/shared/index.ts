// src/i18n/ui/shared/index.ts

import type { Lang } from '../../types';
import { uiSharedJa } from './ja';
import { uiSharedEn } from './en';

export function getUiSharedI18n(lang: Lang) {
  switch (lang) {
    case 'en':
      return uiSharedEn;
    case 'ja':
    default:
      return uiSharedJa;
  }
}

export type UiSharedI18n = ReturnType<typeof getUiSharedI18n>;
