// src/core/models/daily_notes/reviews/SectionKey.ts
export type SectionKey =
  // --- TaskReview ---
  | 'task.planned'
  | 'task.timelog'
  | 'task.review'

  // --- NoteReview ---
  | 'note.review.memo'
  | 'note.report'
  | 'review.point';

export type DailyNoteLabelKey =
  | SectionKey
  // --- 非セクション見出し（Writer/Generator 内部用） ---
  | 'task.timelog.backlog'
  | 'task.timelog.analysis'
  | 'note.tags.daily'
  | 'note.tags.unregistered';
