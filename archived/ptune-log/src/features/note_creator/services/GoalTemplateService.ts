// src/features/note_creator/services/goal/GoalTemplateService.ts

import { GoalCategory } from './GoalCategory';

/**
 * GoalTemplateService
 * - カテゴリから 1 行の目標テンプレートを返す
 * - 現状は固定テンプレ、将来 AI / suggest と統合しやすい構成
 */
export class GoalTemplateService {
  static getTemplate(category: GoalCategory): string {
    switch (category) {
      case GoalCategory.Research:
        return '●●について、現状・課題・要点を 1 行で整理する';

      case GoalCategory.BugFix:
        return '●●の不具合を再現し、原因候補を 1 つ切り分ける';

      case GoalCategory.Implementation:
        return '●●の最小構成（MVP）を 1 つ実装し、動作確認まで行う';

      case GoalCategory.Learning:
        return '●●のドキュメントを確認し、重要点を 3 行以内でまとめる';

      case GoalCategory.Design:
        return '●●の仕様案を 2 パターン比較し、判断材料を整理する';

      case GoalCategory.Summary:
        return '●●の作業内容と得られた知見を 3 行以内でまとめる';

      default:
        return '';
    }
  }
}
