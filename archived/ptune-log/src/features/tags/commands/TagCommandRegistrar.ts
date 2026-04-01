// src/features/llm_tags/services/tags/TagCommandRegistrar.ts
import { App, Plugin, Notice } from 'obsidian';
import { logger } from 'src/core/services/logger/loggerInstance';
import { TagDBMaintainer } from '../services/TagDBMaintainer';
import { TagAliasMerger } from '../services/TagAliasMerger';
import { LLMClient } from 'src/core/services/llm/client/LLMClient';
import { TagVectors } from 'src/core/models/vectors/TagVectors';
import { TagClusteringDebugService } from '../services/TagClusteringDebugService';
import { TagSuggestionService } from '../services/TagSuggestionService';
import { TargetTagEditorDialog } from 'src/core/ui/tags/TargetTagEditorDialog';

export class TagCommandRegistrar {
  constructor(
    private readonly app: App,
    private readonly llmClient: LLMClient
  ) { }

  register(plugin: Plugin) {
    logger.debug('[TagCommandRegistrar.register] start');

    plugin.addCommand({
      id: 'rebuild-tag-db',
      name: 'タグ管理：タグ辞書を再構築',
      callback: async () => {
        new Notice('⏳ タグ辞書の再構築を開始しました', 8000);
        logger.info('[TagCommandRegistrar] rebuild-tag-db start');

        void (async () => {
          try {
            const maint = new TagDBMaintainer(this.app, this.llmClient);
            await maint.rebuildAll();
            new Notice('✅ タグ辞書の更新が完了しました', 10000);
            logger.info('[TagCommandRegistrar] rebuild-tag-db completed');
          } catch (err) {
            logger.error('[TagCommandRegistrar] rebuild-tag-db failed', err);
            new Notice('❌ タグ辞書再構築に失敗しました', 10000);
          }
        })();
      },
    });

    plugin.addCommand({
      id: 'merge-tag-aliases',
      name: 'タグ管理：エイリアス辞書にタグを登録・マージ',
      callback: async () => {
        const merger = new TagAliasMerger(this.app, this.llmClient);
        await merger.run();
        new Notice('✅ タグエイリアス辞書更新');
      },
    });

    plugin.addCommand({
      id: 'debug-tag-kmeans-clustering',
      name: 'Debug: Tag KMeans Clustering',
      callback: async () => {
        const vectors = new TagVectors(this.llmClient);

        await vectors.loadFromVault(plugin.app.vault);

        const service = new TagClusteringDebugService(plugin.app);
        await service.run(vectors);
      },
    });

    plugin.addCommand({
      id: 'tags-open-target-tag-editor-test',
      name: 'Tags: Open TargetTagEditor (test)',
      callback: async () => {
        const tagSuggestionService = new TagSuggestionService(
          this.app,
          this.llmClient
        );

        const dialog = new TargetTagEditorDialog(this.app, {
          state: {
            initialInput: '技術/言語/python',
          },
          search: tagSuggestionService,
          result: {
            confirm: async (tag) => {
              new Notice(`Selected tag: ${tag}`);
            },
          },
        });
        dialog.open();
      },
    });
  }
}
