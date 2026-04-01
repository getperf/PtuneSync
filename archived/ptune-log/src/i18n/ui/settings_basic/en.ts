// src/i18n/ui/settings_basic/en.ts

import type { UiSettingsBasicI18n } from './schema';

export const UI_SETTINGS_BASIC_EN: UiSettingsBasicI18n = {
  heading: 'Basic Settings',

  logLevel: {
    name: 'Log Level',
    desc: 'Select log output level',
    options: {
      debug: 'Debug',
      info: 'Info',
      warn: 'Warning',
      error: 'Error',
      none: 'None',
    },
  },

  enableLogFile: {
    name: 'Enable Log File',
    desc: 'Save logs to a file',
  },
};
