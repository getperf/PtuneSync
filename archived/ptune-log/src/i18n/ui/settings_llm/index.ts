// src/i18n/ui/settings_llm/index.ts

import type { Lang } from 'src/i18n/types';
import type { UiSettingsLlmI18n } from './schema';
import { UI_SETTINGS_LLM_JA } from './ja';
import { UI_SETTINGS_LLM_EN } from './en';

export function getUiSettingsLlmI18n(lang: Lang): UiSettingsLlmI18n {
  switch (lang) {
    case 'en':
      return UI_SETTINGS_LLM_EN;
    case 'ja':
    default:
      return UI_SETTINGS_LLM_JA;
  }
}

export type { UiSettingsLlmI18n };
