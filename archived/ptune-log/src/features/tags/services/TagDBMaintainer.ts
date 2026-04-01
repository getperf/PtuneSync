import { App } from 'obsidian';
import { logger } from 'src/core/services/logger/loggerInstance';
import { TagExtractor } from './TagExtractor';
import { TagVectorBuilder } from 'src/features/vectors';
import { LLMClient } from 'src/core/services/llm/client/LLMClient';
import { TagDBDiffResult } from 'src/features/tag_merge/models/TagDBDiffResult';

export class TagDBMaintainer {
  constructor(
    private app: App,
    private llmClient: LLMClient,
  ) {}

  async rebuildAll(): Promise<void> {
    await this.rebuildInternal();
  }

  // 将来用（現状は全再構築）
  async rebuildByDiff(_diff: TagDBDiffResult): Promise<void> {
    await this.rebuildInternal();
  }

  private async rebuildInternal(): Promise<void> {
    logger.info('[TagDBMaintainer] start rebuild');

    const tags = await TagExtractor.extractAndGroup(this.app);
    await tags.save(this.app.vault);

    if (this.llmClient.hasEmbeddingModel()) {
      const builder = new TagVectorBuilder(this.app, this.llmClient);
      await builder.build();
    }

    logger.info('[TagDBMaintainer] completed');
  }
}
