// src/i18n/ui/settings_note/schema.ts

export interface UiSettingsNoteI18n {
  sectionTitle: string;

  folderPrefix: {
    name: string;
    desc: string;
    options: {
      serial: string;
      date: string;
    };
  };

  notePrefix: {
    name: string;
    desc: string;
    options: {
      serial: string;
      date: string;
    };
  };

  prefixDigits: {
    name: string;
    desc: string;
  };

  template: {
    name: string;
    desc: string;
    placeholder: string;
  };
}
