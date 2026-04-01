import { normalizeNoteSummarySentences } from "../../../domain/note/normalizeNoteSummarySentences";

export class NoteSummaryFormatter {
  format(value: string): string[] {
    const parsedJson = this.parseJsonArray(value);
    if (parsedJson.length > 0) {
      return normalizeNoteSummarySentences(parsedJson);
    }

    return normalizeNoteSummarySentences(value);
  }

  private parseJsonArray(value: string): string[] {
    const normalized = value.trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "");

    if (!normalized.startsWith("[")) {
      return [];
    }

    try {
      const parsed = JSON.parse(normalized);
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string")
        : [];
    } catch {
      return [];
    }
  }
}
