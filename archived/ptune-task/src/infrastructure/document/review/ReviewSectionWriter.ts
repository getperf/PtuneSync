import { DailyNoteDocumentAdapter } from "../adapter/DailyNoteDocumentAdapter";
import { HeadingService } from "../../../domain/heading/HeadingService";
import { hdrAllowPrefixWith } from "md-ast-core";
import { ReviewDocumentRenderer } from "./ReviewDocumentRenderer";
import { ReviewTaskTree } from "../../../application/review/models/ReviewTaskTree";
import { HeadingMatcher } from "../matcher/HeadingMatcher";

export class ReviewSectionWriter {
  constructor(
    private readonly adapter: DailyNoteDocumentAdapter,
    private readonly renderer = new ReviewDocumentRenderer(),
  ) { }

  appendReview(tree: ReviewTaskTree, timeLabel: string): void {
    const review = HeadingService.resolve("daily.section.review.title");

    const timelog = this.adapter.findOrCreateSection(
      "daily.section.timelog.title",
    );

    const existingReview =
      this.adapter.findSectionByMatcher(HeadingMatcher.review(review.baseTitle));

    if (existingReview) {
      existingReview.insertBefore({
        title: `${review.renderedTitle}(${timeLabel})`,
        depth: review.depth,
        content: () => "",
      });
    } else {
      timelog.appendChild({
        title: `${review.renderedTitle}(${timeLabel})`,
        depth: review.depth,
        content: () => "",
      });
    }

    const reviewSection = this.adapter.findSectionByMatcher(
      hdrAllowPrefixWith(review.baseTitle, "\\(" + timeLabel + "\\)"),
    );

    if (!reviewSection) {
      throw new Error("Failed to locate newly appended review section");
    }

    this.renderer.render(reviewSection, tree);
  }
}
