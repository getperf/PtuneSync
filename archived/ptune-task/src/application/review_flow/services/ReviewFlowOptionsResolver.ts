import { config } from "../../../config/config";
import { ReviewFlowOptions } from "../types/ReviewFlowOptions";

export class ReviewFlowOptionsResolver {
  resolve(): ReviewFlowOptions {
    return {
      taskReviewEnabledDefault: config.settings.review.taskReviewEnabledDefault,
      notesReviewEnabledDefault: config.settings.review.notesReviewEnabledDefault,
      reviewPointOutputFormat: config.settings.review.reviewPointOutputFormat,
      taskReviewOutputFormat: config.settings.review.taskReviewOutputFormat,
    };
  }
}
