// src/features/note_creator/services/goal/GoalCategory.ts

/** 目標カテゴリ（NoteCreatorModal で選択する） */
export enum GoalCategory {
  Research = 'research',
  BugFix = 'bugfix',
  Implementation = 'implementation',
  Learning = 'learning',
  Design = 'design',
  Summary = 'summary',
}

/** プルダウン表示名 */
export const GoalCategoryLabels: Record<GoalCategory, string> = {
  [GoalCategory.Research]: '調査',
  [GoalCategory.BugFix]: 'バグ修正',
  [GoalCategory.Implementation]: '実装タスク',
  [GoalCategory.Learning]: '学習',
  [GoalCategory.Design]: '仕様検討',
  [GoalCategory.Summary]: 'まとめ',
};
