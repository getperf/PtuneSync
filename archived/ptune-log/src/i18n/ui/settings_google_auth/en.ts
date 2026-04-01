// src/i18n/ui/settings/en.ts

import type { UiSettingsGoogleAuthI18n } from './schema';

export const UI_SETTINGS_EN: UiSettingsGoogleAuthI18n = {
  sectionTitle: 'Google Authentication',

  useWinApp: {
    name: 'Use Windows App',
    desc: 'Authenticate via PtuneSync (Windows app)',
  },

  clientId: {
    name: 'Client ID',
    desc: 'Client ID issued by Google Cloud Console',
    placeholder: 'xxxxxxxx.apps.googleusercontent.com',
  },

  clientSecret: {
    name: 'Client Secret',
    desc: 'Client Secret issued by Google Cloud Console',
    placeholder: 'xxxxxxxx',
  },
};
