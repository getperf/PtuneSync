import { normalizeNoteSummaryText } from "./normalizeNoteSummaryText";

const LEGACY_SENTENCE_PATTERN = /[^。！？.!?]+[。！？.!?]?/gu;

export function parseLegacySummaryText(value: string): string[] {
  const normalized = normalizeNoteSummaryText(value);

  if (!normalized) {
    return [];
  }

  return (normalized.match(LEGACY_SENTENCE_PATTERN) ?? [])
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}
