// File: src/features/note_creator/strategies/SummaryTagSuggestionStrategy.ts

import { App, TFile, TFolder } from 'obsidian';
import { TagCandidate } from 'src/core/models/tags/TagCandidate';
import { TagVectorSearcher } from 'src/core/services/vector/TagVectorSearcher';
import { SentenceSplitter } from '../utils/SentenceSplitter';
import { logger } from 'src/core/services/logger/loggerInstance';
import { ITagSuggestionStrategy } from './ITagSuggestionStrategy';
import { NoteFrontmatterParser } from 'src/core/utils/frontmatter/NoteFrontmatterParser';

export class SummaryTagSuggestionStrategy implements ITagSuggestionStrategy {
  constructor(
    private readonly app: App,
    private readonly vectorSearcher: TagVectorSearcher,
    private readonly minScore?: number
  ) {}

  async suggestTags(folder: TFolder): Promise<TagCandidate[]> {
    const mdFiles = folder.children.filter(
      (c): c is TFile => c instanceof TFile && c.extension === 'md'
    );

    const agg = new Map<string, { total: number; count: number }>();

    for (const file of mdFiles) {
      const fm = await NoteFrontmatterParser.parseFromFile(this.app, file);
      logger.debug(`[debug] FM keys=${Object.keys(fm)}`);
      logger.debug(`[debug] FM.summary=${fm.summary}`);
      logger.debug(`[debug] Raw FM=${JSON.stringify(fm)}`);
      const summary = fm.summary?.trim();
      if (!summary) {
        logger.debug(
          `[SummaryTagSuggestionStrategy] skip (no summary): ${file.path}`
        );
        continue;
      }

      const sentences = SentenceSplitter.split(summary);

      for (const sentence of sentences) {
        // ★ minScore を TagVectorSearcher に委譲する
        const results = await this.vectorSearcher.search(sentence, {
          limit: 5,
          minScore: this.minScore, // undefined の場合は LLM 設定が利用される
        });

        for (const result of results) {
          const cur = agg.get(result.name) ?? { total: 0, count: 0 };
          cur.total += result.score ?? 0;
          cur.count += 1;
          agg.set(result.name, cur);
        }
      }
    }

    const ranked = [...agg.entries()]
      .map(([name, v]) => ({
        name,
        score: v.total / v.count,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10) as TagCandidate[];

    return ranked;
  }
}
