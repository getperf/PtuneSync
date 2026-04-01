// src/i18n/ui/settings/ja.ts

import type { UiSettingsGoogleAuthI18n } from './schema';

export const UI_SETTINGS_JA: UiSettingsGoogleAuthI18n = {
  sectionTitle: 'Google 認証',

  useWinApp: {
    name: 'Windows アプリを使用',
    desc: 'PtuneSync（Windows アプリ）経由で認証します',
  },

  clientId: {
    name: 'Client ID',
    desc: 'Google Cloud Console で発行した Client ID',
    placeholder: 'xxxxxxxx.apps.googleusercontent.com',
  },

  clientSecret: {
    name: 'Client Secret',
    desc: 'Google Cloud Console で発行した Client Secret',
    placeholder: 'xxxxxxxx',
  },
};
