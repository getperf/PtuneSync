const BULLET_PREFIX_PATTERN = /^([-*•]\s+|\d+\.\s+)/;

export function normalizeNoteSummarySentences(
  value: string | readonly string[] | null | undefined,
): string[] {
  if (value == null) {
    return [];
  }

  const lines = typeof value === "string"
    ? value.replace(/\r\n/g, "\n").split("\n")
    : value;

  return lines
    .map((line) => normalizeSentence(line))
    .filter((line) => line.length > 0);
}

function normalizeSentence(value: string): string {
  return value
    .trim()
    .replace(BULLET_PREFIX_PATTERN, "")
    .replace(/\s+/g, " ");
}
