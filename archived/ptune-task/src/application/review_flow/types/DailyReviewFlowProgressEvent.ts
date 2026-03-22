import { DailyNotesReviewSkippedReason } from "./DailyReviewFlowResult";

export type DailyReviewFlowProgressEvent =
  | { type: "started"; date: string }
  | { type: "task_review_started"; date: string }
  | { type: "task_review_skipped" }
  | { type: "task_review_completed"; taskCount: number }
  | { type: "daily_notes_review_started"; date: string; targetCount: number }
  | { type: "daily_notes_review_progress"; completed: number; total: number; path: string }
  | { type: "daily_notes_review_skipped"; reason: DailyNotesReviewSkippedReason | "disabled" }
  | { type: "daily_notes_review_completed"; noteCount: number; generatedCount: number }
  | { type: "completed" }
  | { type: "failed"; message: string };
