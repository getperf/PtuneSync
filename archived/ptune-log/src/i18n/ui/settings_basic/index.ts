// src/i18n/ui/settings_basic/index.ts

import type { Lang } from 'src/i18n/types';
import type { UiSettingsBasicI18n } from './schema';
import { UI_SETTINGS_BASIC_JA } from './ja';
import { UI_SETTINGS_BASIC_EN } from './en';

export function getUiSettingsBasicI18n(lang: Lang): UiSettingsBasicI18n {
  switch (lang) {
    case 'en':
      return UI_SETTINGS_BASIC_EN;
    case 'ja':
    default:
      return UI_SETTINGS_BASIC_JA;
  }
}

export type { UiSettingsBasicI18n };
