import { DailyNote } from "../../../domain/daily/DailyNote";

export type DailyNotesReviewSkippedReason = "disabled" | "llm-unavailable";

export type DailyReviewFlowResult = {
  note: DailyNote;
  taskReview:
    | {
        executed: true;
        taskCount: number;
      }
    | {
        executed: false;
        taskCount: 0;
      };
  dailyNotesReview:
    | {
        executed: true;
        noteCount: number;
        generatedCount: number;
      }
    | {
        executed: false;
        noteCount: 0;
        generatedCount: 0;
        skippedReason: DailyNotesReviewSkippedReason;
      };
};
