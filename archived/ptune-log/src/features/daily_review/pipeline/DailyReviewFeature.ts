// File: src/features/daily_review/pipeline/DailyReviewFeature.ts
import { App, Plugin } from 'obsidian';
import { logger } from 'src/core/services/logger/loggerInstance';

import { LLMSettings } from 'src/config/settings/LLMSettings';
import { ReviewSettings } from 'src/config/settings/ReviewSettings';

// --- コマンド登録 ---
import { DailyReviewCommandRegistrar } from '../presentation/commands/DailyReviewCommandRegistrar';
import { VectorCommandRegistrar } from '../../vectors/commands/VectorCommandRegistrar';
import { NoteReviewCommandRegistrar } from '../../note_review/commands/NoteReviewCommandRegistrar';
import { TagCommandRegistrar } from '../../tags/commands/TagCommandRegistrar';
import { LLMSettingsCommandRegistrar } from 'src/features/llm_settings/commands/LLMSettingsCommandRegistrar';

// --- core services ---
import { LLMClient } from 'src/core/services/llm/client/LLMClient';
import { TagKindRegistry } from 'src/core/models/tags/TagKindRegistry';

import { NoteAnalysisRunner } from 'src/core/services/llm/note_analysis/NoteAnalysisRunner';
import { NoteAnalysisProcessor } from 'src/core/services/llm/note_analysis/NoteAnalysisProcessor';
import { LLMYamlExtractor } from 'src/core/services/llm/note_analysis/LLMYamlExtractor';
import { NoteLLMAnalyzer } from 'src/core/services/llm/note_analysis/NoteLLMAnalyzer';
import { TagNormalizationService } from 'src/core/services/tags/TagNormalizationService';

// --- feature usecase ---
import { DailyReviewUseCase } from '../application/DailyReviewUseCase';
import { TagMergeCommandRegistrar } from 'src/features/tag_merge/commands/TagMergeCommandRegistrar';

/**
 * --- LLM タグ／分析機能のエントリーポイント
 * core service を組み立て、UseCase と Command を接続する
 */
export class DailyReviewFeature {
  private readonly llmClient: LLMClient;

  private readonly runner: NoteAnalysisRunner;
  private readonly dailyReviewUseCase: DailyReviewUseCase;

  private readonly llmRegistrar: DailyReviewCommandRegistrar;
  private readonly tagRegistrar: TagCommandRegistrar;
  private readonly vectorRegistrar: VectorCommandRegistrar;
  private readonly reviewRegistrar: NoteReviewCommandRegistrar;
  private readonly llmSettingCommandRegistrar: LLMSettingsCommandRegistrar;
  private readonly tagMergeCommandRegistrar: TagMergeCommandRegistrar;

  constructor(
    private readonly app: App,
    llmSettings: LLMSettings,
    reviewSettings: ReviewSettings,
  ) {
    logger.debug('[DailyReviewFeature] initializing');

    // --- LLM クライアント
    this.llmClient = new LLMClient(app, llmSettings);

    // --- Processor 組み立て（core）
    const extractor = new LLMYamlExtractor();
    const analyzer = new NoteLLMAnalyzer(this.llmClient, extractor);
    const normalizer = new TagNormalizationService();
    const processor = new NoteAnalysisProcessor(app, analyzer, normalizer);

    // --- Runner（prompt を知らない）
    this.runner = new NoteAnalysisRunner(app, processor);

    // --- UseCase（prompt を保持）
    this.dailyReviewUseCase = new DailyReviewUseCase(
      app,
      this.llmClient,
      this.runner,
      reviewSettings,
    );

    // --- コマンド登録
    this.llmRegistrar = new DailyReviewCommandRegistrar(
      app,
      this.dailyReviewUseCase,
    );
    this.tagRegistrar = new TagCommandRegistrar(app, this.llmClient);
    this.vectorRegistrar = new VectorCommandRegistrar(app, this.llmClient);
    this.reviewRegistrar = new NoteReviewCommandRegistrar(app, this.llmClient);
    this.llmSettingCommandRegistrar = new LLMSettingsCommandRegistrar(app);
    this.tagMergeCommandRegistrar = new TagMergeCommandRegistrar(
      app,
      this.llmClient,
    );
    logger.debug('[DailyReviewFeature] initialized successfully');
  }

  /** --- コマンド登録 */
  async register(plugin: Plugin): Promise<void> {
    logger.debug('[DailyReviewFeature.register] start');

    const registry = TagKindRegistry.getInstance(plugin.app.vault);
    await registry.ensure();

    this.llmRegistrar.register(plugin);
    this.tagRegistrar.register(plugin);
    this.vectorRegistrar.register(plugin);
    this.reviewRegistrar.register(plugin);
    this.llmSettingCommandRegistrar.register(plugin);
    this.tagMergeCommandRegistrar.register(plugin);

    logger.debug('[DailyReviewFeature.register] complete');
  }
}
