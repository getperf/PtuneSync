import { ReviewOutputFormat } from "../../../config/types";

export type ReviewFlowRunOptions = {
  date: string;
  taskReviewEnabled: boolean;
  dailyNotesReviewEnabled: boolean;
  reviewPointOutputFormat: ReviewOutputFormat;
};
