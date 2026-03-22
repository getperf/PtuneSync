// src/core/i18n/domain/daily_note/ja.ts
import { DailyNoteLabelKey } from 'src/core/models/daily_notes/SectionKey';

export const ja: Record<DailyNoteLabelKey, string> = {
  // --- TaskReview (section) ---
  'task.planned': '今日の予定タスク（手動で追記OK）',
  'task.timelog': 'タイムログ／メモ',
  'task.review': 'タスク振り返り',

  // --- TaskReview (fragment) ---
  'task.timelog.backlog': '未完了タスク',
  'task.timelog.analysis': '時間分析サマリ',

  // --- NoteReview ---
  'note.review.memo': '振り返りメモ',

  // fragments
  'note.tags.daily': 'タグ一覧（当日生成）',
  'note.tags.unregistered': '未登録タグ候補（要レビュー）',

  // sections
  'note.report': 'デイリーレポート',
  'review.point': '振り返りポイント',
};
