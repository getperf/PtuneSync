// src/i18n/ui/settings_snippet/index.ts

import type { Lang } from 'src/i18n/types';
import type { UiSettingsSnippetI18n } from './schema';
import { UI_SETTINGS_SNIPPET_JA } from './ja';
import { UI_SETTINGS_SNIPPET_EN } from './en';

export function getUiSettingsSnippetI18n(
  lang: Lang
): UiSettingsSnippetI18n {
  switch (lang) {
    case 'en':
      return UI_SETTINGS_SNIPPET_EN;
    case 'ja':
    default:
      return UI_SETTINGS_SNIPPET_JA;
  }
}

export type { UiSettingsSnippetI18n };
