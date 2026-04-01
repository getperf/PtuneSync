// src/features/daily_review/services/DailyReviewSummaryCommentBuilder.ts

import { MarkdownCommentBlock } from 'src/core/utils/markdown/MarkdownCommentBlock';
import { getText } from '../../i18n/comment';

export class DailyReviewSummaryCommentBuilder {
  private static readonly KIND = 'daily-review-comment';

  static build(): string {
    const lines = getText(this.KIND);
    return MarkdownCommentBlock.build(lines);
  }
}
