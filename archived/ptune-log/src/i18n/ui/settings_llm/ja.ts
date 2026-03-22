// src/i18n/ui/settings_llm/ja.ts

import type { UiSettingsLlmI18n } from './schema';

export const UI_SETTINGS_LLM_JA: UiSettingsLlmI18n = {
  sectionTitle: 'LLM 設定',

  provider: {
    name: 'プロバイダ',
    desc: '使用する LLM プロバイダを選択します',
    options: {
      'OpenAI Chat': 'OpenAI',
      'Anthropic Claude': 'Claude',
      Gemini: 'Gemini',
      Custom: 'Custom',
    },
  },

  apiKey: {
    name: 'APIキー',
    desc: 'LLM プロバイダの API キー',
    placeholder: 'sk-...',
  },

  baseUrl: {
    name: 'Base URL',
    desc: 'カスタム API エンドポイント',
  },

  model: {
    name: 'モデル',
    desc: '使用するモデル名',
  },

  embeddingModel: {
    name: '埋め込みモデル',
    desc: 'ベクトル検索に使用するモデル',
    options: {
      '': '未使用',
      'text-embedding-3-small': 'text-embedding-3-small',
      'text-embedding-3-large': 'text-embedding-3-large',
    },
  },

  temperature: {
    name: 'Temperature',
    desc: '生成結果のばらつき',
  },

  maxTokens: {
    name: '最大トークン数',
    desc: '生成に使用する最大トークン数',
    placeholder: '2048',
  },

  minSimilarityScore: {
    name: '最小類似度',
    desc: 'タグ類似度の下限値',
  },

  enableChecklist: {
    name: 'チェックリストを有効化',
    desc: 'レビュー時にチェックリストを生成します',
  },

  promptTemplate: {
    name: 'プロンプトテンプレート',
    desc: (path) => `ノート ${path} を使用します`,
    buttons: {
      select: '選択',
      open: '開く',
    },
    noticeNotFound: (path) => `テンプレートが見つかりません: ${path}`,
  },

  promptPreview: {
    name: 'プロンプトプレビュー',
    desc: '実行前にプロンプトを確認します',
    button: 'プレビュー',
    noticeOpen: 'プレビューを開きました',
    noticeFail: 'プレビューに失敗しました',
  },
};
