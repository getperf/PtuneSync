// src/features/daily_review/services/note_summary/SentenceSummaryAdapter.ts

import { logger } from 'src/core/services/logger/loggerInstance';
import {
  NoteSummaryDocument,
  Sentence,
} from '../../domain/models/NoteSummaryDocument';

export type SentenceInput = {
  id: string;
  text: string;
};

export type SentenceOutput = {
  id: string;
  summary: string;
};

type IndexedSentence = {
  id: string;
  sentence: Sentence;
};

export class SentenceSummaryAdapter {
  private readonly indexed: IndexedSentence[];

  constructor(private readonly doc: NoteSummaryDocument) {
    this.indexed = this.collectSentencesWithId();
  }

  /** LLM 入力用 */
  extract(): SentenceInput[] {
    return this.indexed.map(({ id, sentence }) => ({
      id,
      text: sentence.text,
    }));
  }

  /** LLM 出力の差し戻し */
  apply(outputText: string): void {
    let results: SentenceOutput[];
    try {
      results = JSON.parse(outputText);
    } catch {
      return; // JSON 不正 → 原文維持
    }

    const map = new Map(
      results.filter((r) => r.id && r.summary).map((r) => [r.id, r.summary]),
    );

    for (const { id, sentence } of this.indexed) {
      const summary = map.get(id);
      if (summary) {
        sentence.text = summary;
      }
    }
  }

  /** Document 構造に依存するのはここだけ */
  private collectSentencesWithId(): IndexedSentence[] {
    const result: IndexedSentence[] = [];
    let i = 0;

    for (const project of this.doc.projects) {
      for (const note of project.notes) {
        for (const sentence of note.sentences) {
          result.push({
            id: `s${i++}`, // 一時ID（差し戻し専用）
            sentence,
          });
        }
      }
    }

    return result;
  }
}
