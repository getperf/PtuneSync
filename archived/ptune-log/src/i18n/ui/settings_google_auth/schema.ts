// src/i18n/ui/settings/schema.ts

export interface UiSettingsGoogleAuthI18n {
  sectionTitle: string;

  useWinApp: {
    name: string;
    desc: string;
  };

  clientId: {
    name: string;
    desc: string;
    placeholder: string;
  };

  clientSecret: {
    name: string;
    desc: string;
    placeholder: string;
  };
}
