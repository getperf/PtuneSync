// src/i18n/ui/index.ts

import type { Lang } from '../types';

import { getUiCommonI18n } from './common';
import { getUiSettingsBasicI18n } from './settings_basic';
import { getUiSettingsGoogleAuthI18n } from './settings_google_auth';
import { getUiSettingsLlmI18n } from './settings_llm';
import { getUiSettingsNoteI18n } from './settings_note';
import { getUiSettingsSnippetI18n } from './settings_snippet';
import { getUiSettingsReviewI18n } from './settings_review';
import { getTimeReviewI18n } from './time_review';
import { getUiSharedI18n } from './shared';
import { getDailyReviewI18n } from './daily_review';
import { getNoteAnalysisI18n } from './note_analysis';
import { getTagMergeI18n } from './tag_merge';

export function getUiI18n(lang: Lang) {
  return {
    // 設定タブラベル
    common: getUiCommonI18n(lang),
    settingsBasic: getUiSettingsBasicI18n(lang),
    settingsGoogleAuth: getUiSettingsGoogleAuthI18n(lang),
    settingsLlm: getUiSettingsLlmI18n(lang),
    settingsNote: getUiSettingsNoteI18n(lang),
    settingsSnippet: getUiSettingsSnippetI18n(lang),
    settingsReview: getUiSettingsReviewI18n(lang),

    // ドメイン固有の設定
    shared: getUiSharedI18n(lang),
    timeReview: getTimeReviewI18n(lang),
    dailyReview: getDailyReviewI18n(lang),
    noteAnalysis: getNoteAnalysisI18n(lang),
    tagMerge: getTagMergeI18n(lang),
  };
}

export type UiI18n = ReturnType<typeof getUiI18n>;
