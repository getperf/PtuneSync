// src/i18n/ui/settings_note/ja.ts

import type { UiSettingsNoteI18n } from './schema';

export const UI_SETTINGS_NOTE_JA: UiSettingsNoteI18n = {
  sectionTitle: 'ノート設定',

  folderPrefix: {
    name: 'フォルダ接頭辞',
    desc: 'プロジェクト／日誌フォルダ名の付与方式',
    options: {
      serial: '連番',
      date: '日付',
    },
  },

  notePrefix: {
    name: 'ノート接頭辞',
    desc: 'ノートファイル名の付与方式',
    options: {
      serial: '連番',
      date: '日付',
    },
  },

  prefixDigits: {
    name: '連番の桁数',
    desc: '連番指定時のゼロ埋め桁数',
  },

  template: {
    name: 'テンプレートファイル',
    desc: '新規ノート作成時に使用するテンプレート',
    placeholder: '_templates/note/default.md',
  },
};
