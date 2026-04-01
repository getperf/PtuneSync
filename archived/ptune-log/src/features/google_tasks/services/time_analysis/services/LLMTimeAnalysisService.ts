// File: src/features/google_tasks/services/time_analysis/services/LLMTimeAnalysisService.ts

import { App, normalizePath } from 'obsidian';
import { TimeAnalysisPromptBuilder } from '../llm/TimeAnalysisPromptBuilder';
import { LLMClient } from 'src/core/services/llm/client/LLMClient';
import { logger } from 'src/core/services/logger/loggerInstance';

export class LLMTimeAnalysisService {
  private readonly promptBuilder = new TimeAnalysisPromptBuilder();

  constructor(
    private readonly app: App,
    private readonly llmClient: LLMClient
  ) {}

  /**
   * 時間分析 YAML を入力として LLM 分析を実行し、
   * Markdown（またはプレーンテキスト）を返す
   */
  async analyzeFromYamlFile(yamlPath: string): Promise<string | null> {
    const adapter = this.app.vault.adapter;
    const path = normalizePath(yamlPath);

    logger.info(`[LLMTimeAnalysisService] load yaml: ${path}`);
    const yamlText = await adapter.read(path);

    const systemPrompt =
      'あなたは1日の作業ログを分析し、改善点を示すアシスタントです。';

    const userPrompt = this.promptBuilder.buildUserPrompt(yamlText, {
      headingLevel: 5,
    });

    const result = await this.llmClient.complete(systemPrompt, userPrompt);

    if (!result) {
      logger.warn('[LLMTimeAnalysisService] LLM returned null');
      return null;
    }

    return result;
  }
}
