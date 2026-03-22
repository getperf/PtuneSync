// src/i18n/ui/settings_llm/en.ts

import type { UiSettingsLlmI18n } from './schema';

export const UI_SETTINGS_LLM_EN: UiSettingsLlmI18n = {
  sectionTitle: 'LLM Settings',

  provider: {
    name: 'Provider',
    desc: 'Select LLM provider',
    options: {
      'OpenAI Chat': 'OpenAI',
      'Anthropic Claude': 'Claude',
      Gemini: 'Gemini',
      Custom: 'Custom',
    },
  },

  apiKey: {
    name: 'API Key',
    desc: 'API key for the provider',
    placeholder: 'sk-...',
  },

  baseUrl: {
    name: 'Base URL',
    desc: 'Custom API endpoint',
  },

  model: {
    name: 'Model',
    desc: 'Model name',
  },

  embeddingModel: {
    name: 'Embedding Model',
    desc: 'Model used for embeddings',
    options: {
      '': 'Disabled',
      'text-embedding-3-small': 'text-embedding-3-small',
      'text-embedding-3-large': 'text-embedding-3-large',
    },
  },

  temperature: {
    name: 'Temperature',
    desc: 'Randomness of generation',
  },

  maxTokens: {
    name: 'Max Tokens',
    desc: 'Maximum tokens per request',
    placeholder: '2048',
  },

  minSimilarityScore: {
    name: 'Minimum Similarity',
    desc: 'Lower bound of similarity score',
  },

  enableChecklist: {
    name: 'Enable Checklist',
    desc: 'Generate checklist for review',
  },

  promptTemplate: {
    name: 'Prompt Template',
    desc: (path) => `Using note: ${path}`,
    buttons: {
      select: 'Select',
      open: 'Open',
    },
    noticeNotFound: (path) => `Template not found: ${path}`,
  },

  promptPreview: {
    name: 'Prompt Preview',
    desc: 'Preview prompt before execution',
    button: 'Preview',
    noticeOpen: 'Preview opened',
    noticeFail: 'Failed to open preview',
  },
};
