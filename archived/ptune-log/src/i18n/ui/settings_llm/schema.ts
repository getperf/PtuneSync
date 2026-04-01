// src/i18n/ui/settings_llm/schema.ts

export interface UiSettingsLlmI18n {
  sectionTitle: string;

  provider: {
    name: string;
    desc: string;
    options: Record<string, string>;
  };

  apiKey: {
    name: string;
    desc: string;
    placeholder: string;
  };

  baseUrl: {
    name: string;
    desc: string;
  };

  model: {
    name: string;
    desc: string;
  };

  embeddingModel: {
    name: string;
    desc: string;
    options: Record<string, string>;
  };

  temperature: {
    name: string;
    desc: string;
  };

  maxTokens: {
    name: string;
    desc: string;
    placeholder: string;
  };

  minSimilarityScore: {
    name: string;
    desc: string;
  };

  enableChecklist: {
    name: string;
    desc: string;
  };

  promptTemplate: {
    name: string;
    desc: (notePath: string) => string;
    buttons: {
      select: string;
      open: string;
    };
    noticeNotFound: (notePath: string) => string;
  };

  promptPreview: {
    name: string;
    desc: string;
    button: string;
    noticeOpen: string;
    noticeFail: string;
  };
}
