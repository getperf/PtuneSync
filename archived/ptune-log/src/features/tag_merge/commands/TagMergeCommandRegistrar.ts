// src/features/tag_merge/commands/TagMergeCommandRegistrar.ts
import { App, Plugin } from 'obsidian';
import { LLMClient } from 'src/core/services/llm/client/LLMClient';
import { logger } from 'src/core/services/logger/loggerInstance';
import { TagMergeUseCase } from '../applcation/TagMergeUseCase';

export class TagMergeCommandRegistrar {
  constructor(
    private readonly app: App,
    private readonly client: LLMClient,
  ) {}

  register(plugin: Plugin): void {
    plugin.addCommand({
      id: 'tag-merge-clustering',
      name: 'Tag Merge (Clustering)',
      callback: async () => {
        logger.debug('[TagMergeCommand] invoked');

        const useCase = new TagMergeUseCase(this.app, this.client);

        await useCase.open();
      },
    });
  }
}
