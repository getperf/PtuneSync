// src/i18n/ui/settings_basic/schema.ts

export interface UiSettingsBasicI18n {
  heading: string;

  logLevel: {
    name: string;
    desc: string;
    options: {
      debug: string;
      info: string;
      warn: string;
      error: string;
      none: string;
    };
  };

  enableLogFile: {
    name: string;
    desc: string;
  };
}
