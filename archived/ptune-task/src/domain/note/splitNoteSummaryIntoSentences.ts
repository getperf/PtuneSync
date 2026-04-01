import { normalizeNoteSummaryText } from "./normalizeNoteSummaryText";

const SENTENCE_PATTERN = /[^。！？.!?]+[。！？.!?]?/gu;

export function splitNoteSummaryIntoSentences(value: string): string[] {
  const normalized = normalizeNoteSummaryText(value);

  if (!normalized) {
    return [];
  }

  return (normalized.match(SENTENCE_PATTERN) ?? [])
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}
