// File: src/features/daily_review/services/DailyReviewSummaryBuilder.ts
import { NoteSummaries } from 'src/core/models/notes/NoteSummaries';
import { ReviewSettings } from 'src/config/settings/ReviewSettings';
import { SummaryRenderOptions } from 'src/core/services/notes/NoteSummaryMarkdownBuilder';

export class DailyReviewSummaryBuilder {
  static build(summaries: NoteSummaries, settings: ReviewSettings): string {
    const options = this.toRenderOptions(settings);

    return summaries.summaryMarkdown({
      baseHeadingLevel: 4,
      ...options,
    });
  }

  private static toRenderOptions(
    settings: ReviewSettings,
  ): SummaryRenderOptions {
    return {
      checklist: false,
      sentenceSplit: false,
      withLink: true,
      withUserReview: false,
    };
  }
}
