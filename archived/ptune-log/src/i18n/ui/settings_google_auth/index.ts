// src/i18n/ui/settings/index.ts

import type { UiSettingsGoogleAuthI18n } from './schema';
import { UI_SETTINGS_JA } from './ja';
import { UI_SETTINGS_EN } from './en';
import { Lang } from 'src/i18n/types';

export function getUiSettingsGoogleAuthI18n(lang: Lang): UiSettingsGoogleAuthI18n {
  switch (lang) {
    case 'en':
      return UI_SETTINGS_EN;
    case 'ja':
    default:
      return UI_SETTINGS_JA;
  }
}

export type { UiSettingsGoogleAuthI18n };
