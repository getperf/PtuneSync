// src/i18n/ui/settings_review/ja.ts

import type { UiSettingsReviewI18n } from './schema';

export const UI_SETTINGS_REVIEW_JA: UiSettingsReviewI18n = {
  sectionTitle: '振り返り設定',

  enableCommonTag: {
    name: '共通タグの自動付与',
    desc: '振り返り時に、フォルダ内ノートの共通タグを自動で付与します。',
  },

  enableDailyNoteUserReview: {
    name: 'ユーザーレビュー有効化',
    desc: 'デイリーノートのユーザレビューカスタマイズを有効にします。',
  },

  kptOutputMode: {
    name: 'KPT 出力形式',
    desc: 'KPT分析結果の出力形式を選択します。',
    options: {
      markdown: 'Markdown（アウトライナー向け）',
      text: 'テキスト（XMind／マインドマップ）',
    },
  },

  sentenceMode: {
    name: 'センテンス要約モード',
    desc: 'センテンス要約の生成方法を選択します。',
    options: {
      none: '無効',
      llm: 'LLM による要約',
    },
  },

  noteSummaryOutputFormat: {
    name: 'ノート要約の出力形式',
    desc: 'ノート要約結果の出力形式を選択します。',
    options: {
      outliner: 'アウトライナー（Markdown）',
      xmind: 'XMind／マインドマップ',
    },
  },
};
