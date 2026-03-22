// src/i18n/ui/settings_note/en.ts

import type { UiSettingsNoteI18n } from './schema';

export const UI_SETTINGS_NOTE_EN: UiSettingsNoteI18n = {
  sectionTitle: 'Note Settings',

  folderPrefix: {
    name: 'Folder Prefix',
    desc: 'Prefix rule for project/journal folders',
    options: {
      serial: 'Serial',
      date: 'Date',
    },
  },

  notePrefix: {
    name: 'Note Prefix',
    desc: 'Prefix rule for note filenames',
    options: {
      serial: 'Serial',
      date: 'Date',
    },
  },

  prefixDigits: {
    name: 'Prefix Digits',
    desc: 'Zero-padding length for serial numbers',
  },

  template: {
    name: 'Template File',
    desc: 'Template used for new notes',
    placeholder: '_templates/note/default.md',
  },
};
