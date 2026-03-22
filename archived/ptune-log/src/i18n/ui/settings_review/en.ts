// src/i18n/ui/settings_review/en.ts

import type { UiSettingsReviewI18n } from './schema';

export const UI_SETTINGS_REVIEW_EN: UiSettingsReviewI18n = {
  sectionTitle: 'Review Settings',

  enableCommonTag: {
    name: 'Enable Common Tags',
    desc: 'Automatically apply common tags found in project notes during review.',
  },

  enableDailyNoteUserReview: {
    name: 'Enable User Review',
    desc: 'Enables user review customization for daily notes.',
  },

  kptOutputMode: {
    name: 'KPT Output Format',
    desc: 'Select the output format for KPT analysis results.',
    options: {
      markdown: 'Markdown (Outliner)',
      text: 'Text (XMind / Mind Map)',
    },
  },

  sentenceMode: {
    name: 'Sentence Summary Mode',
    desc: 'Select how sentence summaries are generated.',
    options: {
      none: 'Disabled',
      llm: 'LLM-based summary',
    },
  },

  noteSummaryOutputFormat: {
    name: 'Note Summary Output Format',
    desc: 'Select the output format for note summaries.',
    options: {
      outliner: 'Outliner (Markdown)',
      xmind: 'XMind / Mind Map',
    },
  },
};
