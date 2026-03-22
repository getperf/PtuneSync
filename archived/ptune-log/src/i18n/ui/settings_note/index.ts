// src/i18n/ui/settings_note/index.ts

import type { Lang } from 'src/i18n/types';
import type { UiSettingsNoteI18n } from './schema';
import { UI_SETTINGS_NOTE_JA } from './ja';
import { UI_SETTINGS_NOTE_EN } from './en';

export function getUiSettingsNoteI18n(lang: Lang): UiSettingsNoteI18n {
  switch (lang) {
    case 'en':
      return UI_SETTINGS_NOTE_EN;
    case 'ja':
    default:
      return UI_SETTINGS_NOTE_JA;
  }
}

export type { UiSettingsNoteI18n };
