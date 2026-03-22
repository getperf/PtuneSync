// src/i18n/ui/settings_review/schema.ts

export interface UiSettingsReviewI18n {
  sectionTitle: string;

  enableCommonTag: {
    name: string;
    desc: string;
  };

  enableDailyNoteUserReview: {
    name: string;
    desc: string;
  };

  kptOutputMode: {
    name: string;
    desc: string;
    options: {
      markdown: string;
      text: string;
    };
  };

  sentenceMode: {
    name: string;
    desc: string;
    options: {
      none: string;
      llm: string;
    };
  };

  noteSummaryOutputFormat: {
    name: string;
    desc: string;
    options: {
      outliner: string;
      xmind: string;
    };
  };
}
