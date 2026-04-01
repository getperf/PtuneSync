// src/core/models/daily_notes/DailyNoteSection.ts

/** デイリーノート内セクションの論理キー */
export enum DailyNoteSectionKeyOld {
  // === 大分類 ===
  PlannedTasks = 'PlannedTasks',
  TimeLog = 'TimeLog',
  ReviewMemo = 'Review',

  // === 振り返り配下 ===
  DailyReport = 'DailyReport',
  TagList = 'TagList',
  Kpt = 'Kpt',

  // === 時間分析配下 ===
  TimeAnalysisSummary = 'TimeAnalysisSummary',
  Backlog = 'Backlog',
  DeltaLarge = 'DeltaLarge',
  WorkTypeSummary = 'WorkTypeSummary',
  DailySummary = 'DailySummary',
}
