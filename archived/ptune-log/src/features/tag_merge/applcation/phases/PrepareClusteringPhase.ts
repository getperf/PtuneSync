// src/features/tag_merge/application/phases/PrepareClusteringPhase.ts

import { App } from 'obsidian';
import { LLMClient } from 'src/core/services/llm/client/LLMClient';
import { TagMergeFlowDialog } from '../../ui/dialogs/TagMergeFlowDialog';
import { PrepareClusteringView } from '../../ui/phases/PrepareClusteringView';
import { TagMergeContext } from '../TagMergeContext';
import { TagMergeDiffService } from '../../services/diff/TagMergeDiffService';
import { TagMergeClusteringService } from '../../services/clustering/TagMergeClusteringService';
import { TagMergeClusteringOptions } from '../../models/TagMergeClusteringOptions';
import { TagMergeViewModelBuilder } from '../../services/viewmodel/TagMergeViewModelBuilder';
import { TagDBMaintainer } from 'src/features/tags/services/TagDBMaintainer';
import { TagAliases } from 'src/core/models/tags/TagAliases';
import { Tags } from 'src/core/models/tags/Tags';
import { logger } from 'src/core/services/logger/loggerInstance';
import { DebugViewModal } from '../../ui/utils/DebugViewModal';

export class PrepareClusteringPhase {
  constructor(
    private readonly app: App,
    private readonly llmClient: LLMClient,
    private readonly dialog: TagMergeFlowDialog,
    private readonly context: TagMergeContext,
    private readonly onNext: () => void,
    private readonly onCancel: () => void,
  ) {}

  async open(): Promise<void> {
    const diffService = new TagMergeDiffService(this.app, this.llmClient);
    const diffSummary = await diffService.detect();
    const baseMessages = diffService.buildMessages(diffSummary);

    const hasDiff =
      diffSummary.tagDB.added.length > 0 ||
      diffSummary.tagDB.removed.length > 0 ||
      diffSummary.vectorDB.added.length > 0 ||
      diffSummary.vectorDB.removed.length > 0;

    // --- 初期表示用（参考値）
    const displayOptions = this.context.clusteringOptions;
    await this.fillCounts(displayOptions);
    displayOptions.k = this.resolveK(displayOptions);

    const messages = [
      ...baseMessages,
      `タグ総数: ${displayOptions.totalTagCount}`,
      `未登録タグ数: ${displayOptions.exclusion?.unregisteredCount ?? 0}`,
      `クラスタ数 (k): ${displayOptions.k}`,
    ];

    const view = new PrepareClusteringView(
      async (options: TagMergeClusteringOptions, rebuildDb: boolean) => {
        // ★ 実行時は必ず再計算
        await this.fillCounts(options);
        options.k = this.resolveK(options);

        logger.debug(
          `[PrepareClustering] run: total=${options.totalTagCount}, unregistered=${options.exclusion?.unregisteredCount}, k=${options.k}`,
        );

        // --- clustering options を確定 ---
        this.context.clusteringOptions = options;

        // --- debug options を確定 ---
        const debugOptions = view.getDebugOptions();
        this.context.debugOptions = debugOptions;

        if (rebuildDb) {
          view.updateStatus('DB 更新中...');
          const maintainer = new TagDBMaintainer(this.app, this.llmClient);
          await maintainer.rebuildAll();
        }

        view.updateStatus('クラスタリング中...');
        const clusteringService = new TagMergeClusteringService();
        const vmBuilder = new TagMergeViewModelBuilder();

        const result = await clusteringService.run(
          this.app,
          this.llmClient,
          options,
        );

        // --- デバッグ表示（UI 制御） ---
        if (this.context.debugOptions.showWorkDataDebug && result.debugText) {
          new DebugViewModal(
            this.app,
            'Clustering Debug',
            result.debugText,
          ).open();
        }

        this.context.priorityGroups = vmBuilder.build(result.clusters);

        view.updateStatus('完了');
        this.onNext();
      },
      this.onCancel,
      messages,
      displayOptions,
      hasDiff,
    );

    view.updateStatus('準備中...');
    this.dialog.setPhaseView(view);
  }

  private async fillCounts(options: TagMergeClusteringOptions): Promise<void> {
    const tags = new Tags();
    await tags.load(this.app.vault);
    options.totalTagCount = tags.getAll().length;

    const aliases = new TagAliases();
    await aliases.load(this.app.vault);
    const unchecked = aliases.getUnchecked();

    options.exclusion = {
      ...options.exclusion,
      unregisteredCount: unchecked.length,
    };
  }

  private resolveK(options: TagMergeClusteringOptions): number {
    if (options.exclusion?.unregisteredOnly) {
      return Math.max(1, options.exclusion.unregisteredCount ?? 1);
    }
    return Math.max(1, Math.floor((options.totalTagCount ?? 1) * 0.7));
  }
}
