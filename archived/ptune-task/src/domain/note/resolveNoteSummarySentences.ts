import { parseLegacySummaryText } from "./parseLegacySummaryText";

export type NoteSummaryLike = {
  summarySentences?: readonly string[] | null;
  summary?: string | null;
};

export function resolveNoteSummarySentences(note: NoteSummaryLike): string[] {
  if (Array.isArray(note.summarySentences)) {
    return note.summarySentences
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  if (typeof note.summary === "string") {
    return parseLegacySummaryText(note.summary);
  }

  return [];
}
