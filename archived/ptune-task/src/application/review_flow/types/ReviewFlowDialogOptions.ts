import { ReviewOutputFormat } from "../../../config/types";

export type ReviewFlowDialogOptions = {
  date: string;
  dateCandidates: string[];
  taskReviewEnabled: boolean;
  dailyNotesReviewEnabled: boolean;
  reviewPointOutputFormat: ReviewOutputFormat;
};
