// File: src/config/settings/ReviewSettings.ts

/** Sentence 要約モード */
export type SentenceMode = 'none' | 'llm';

/** ノート要約の出力形式 */
export type NoteSummaryOutputFormat = 'outliner' | 'xmind';

export interface ReviewSettings {
  /** Sentence 要約モード */
  sentenceMode: SentenceMode;

  /** ノート要約出力形式 */
  noteSummaryOutputFormat: NoteSummaryOutputFormat;
}

export const DEFAULT_REVIEW_SETTINGS: ReviewSettings = {
  // enableCommonTag: false,
  // enableDailyNoteUserReview: true,
  // kptOutputMode: 'markdown',

  // --- defaults ---
  sentenceMode: 'llm',
  noteSummaryOutputFormat: 'xmind',
};
