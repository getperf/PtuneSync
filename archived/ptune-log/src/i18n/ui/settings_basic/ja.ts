// src/i18n/ui/settings_basic/ja.ts

import type { UiSettingsBasicI18n } from './schema';

export const UI_SETTINGS_BASIC_JA: UiSettingsBasicI18n = {
  heading: '基本設定',

  logLevel: {
    name: 'ログレベル',
    desc: 'ログの出力レベルを指定します',
    options: {
      debug: 'デバッグ',
      info: '情報',
      warn: '警告',
      error: 'エラー',
      none: '出力しない',
    },
  },

  enableLogFile: {
    name: 'ログファイル出力',
    desc: 'ログをファイルに保存します',
  },
};
