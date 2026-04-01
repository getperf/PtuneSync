import { DailyNotesReflectionDocument, ReflectionSentence } from "../models/DailyNotesReflectionDocument";
import { logger } from "../../../shared/logger/loggerInstance";

type SentenceInput = {
  id: string;
  text: string;
};

type SentenceOutput = {
  id: string;
  summary: string;
};

type IndexedSentence = {
  id: string;
  sentence: ReflectionSentence;
};

export class SentenceSummaryAdapter {
  private readonly indexed: IndexedSentence[];

  constructor(private readonly doc: DailyNotesReflectionDocument) {
    this.indexed = this.collect();
  }

  extract(): SentenceInput[] {
    return this.indexed.map(({ id, sentence }) => ({
      id,
      text: sentence.text,
    }));
  }

  apply(outputText: string): void {
    let results: SentenceOutput[];
    try {
      results = JSON.parse(this.extractJsonArray(outputText)) as SentenceOutput[];
    } catch (error) {
      logger.warn(
        `[Service] SentenceSummaryAdapter.apply parseFailed chars=${outputText.length}`,
        error,
      );
      return;
    }

    const map = new Map(
      results
        .filter((result) => typeof result.id === "string" && typeof result.summary === "string")
        .map((result) => [result.id, result.summary.trim()]),
    );

    logger.debug(
      `[Service] SentenceSummaryAdapter.apply parsed results=${results.length} usable=${map.size}`,
    );

    let applied = 0;
    for (const { id, sentence } of this.indexed) {
      const summary = map.get(id);
      if (summary) {
        sentence.text = summary;
        applied += 1;
      }
    }

    logger.debug(
      `[Service] SentenceSummaryAdapter.apply applied=${applied} indexed=${this.indexed.length}`,
    );
  }

  private collect(): IndexedSentence[] {
    const result: IndexedSentence[] = [];
    let index = 0;

    for (const project of this.doc.projects) {
      for (const note of project.notes) {
        for (const sentence of note.sentences) {
          result.push({
            id: `s${index++}`,
            sentence,
          });
        }
      }
    }

    return result;
  }

  private extractJsonArray(value: string): string {
    const normalized = value
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "");

    const first = normalized.indexOf("[");
    const last = normalized.lastIndexOf("]");

    if (first >= 0 && last >= first) {
      return normalized.slice(first, last + 1);
    }

    return normalized;
  }
}
