// src/features/daily_review/application/note_summary/DailyNoteSummaryUseCase.ts

import { App } from 'obsidian';
import { NoteSummaries } from 'src/core/models/notes/NoteSummaries';
import { NoteSummaryDocumentBuilder } from '../../infrastructure/note_summary/NoteSummaryDocumentBuilder';
import {
  OutputFormat,
  ReportBuilderFactory,
} from '../../infrastructure/note_summary/ReportBuilderFactory';
import { buildSentenceSummarySystemPrompt } from '../../infrastructure/note_summary/prompts';
import { LLMClient } from 'src/core/services/llm/client/LLMClient';
import { SentenceSummaryAdapter } from '../../infrastructure/note_summary/SentenceSummaryAdapter';
import { logger } from 'src/core/services/logger/loggerInstance';
import { NoteSummaryDocument } from '../../domain/models/NoteSummaryDocument';
import { ReviewSettings } from 'src/config/settings/ReviewSettings';

export class DailyNoteSummaryUseCase {
  constructor(
    private readonly app: App,
    private readonly llmClient: LLMClient,
    private readonly reviewSettings: ReviewSettings,
  ) {}

  async execute(summaries: NoteSummaries): Promise<string> {
    // 1. 構造化ドキュメント生成
    const doc = await NoteSummaryDocumentBuilder.build(this.app, summaries);

    // 2. LLM 要約
    if (this.reviewSettings.sentenceMode === 'llm') {
      await this.applyLlmSentenceSummary(doc);
    }

    // 3. 出力生成
    const builder = ReportBuilderFactory.create(
      this.reviewSettings.noteSummaryOutputFormat as OutputFormat,
    );

    return builder.build(doc);
  }

  /**
   * LLM による Sentence 要約を適用する
   * - 失敗時は何もしない（原文維持）
   */
  private async applyLlmSentenceSummary(
    doc: NoteSummaryDocument,
  ): Promise<void> {
    const adapter = new SentenceSummaryAdapter(doc);
    const sentenceInputs = adapter.extract();

    logger.debug(
      '[DailyNoteSummaryUseCase] extracted sentences=%d',
      sentenceInputs.length,
    );

    if (sentenceInputs.length === 0) {
      return;
    }

    const system = buildSentenceSummarySystemPrompt();
    const user = JSON.stringify(sentenceInputs, null, 2);

    const output = await this.llmClient.complete(system, user);

    if (!output) {
      logger.warn('[DailyNoteSummaryUseCase] LLM returned null');
      return;
    }

    logger.debug('[DailyNoteSummaryUseCase] LLM raw output=%s', output);

    const normalized = output
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '');

    adapter.apply(normalized);
  }
}
