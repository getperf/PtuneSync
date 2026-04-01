// features/tag_merge/application/TagMergeUseCase.ts

import { App } from 'obsidian';
import { LLMClient } from 'src/core/services/llm/client/LLMClient';
import { TagMergeFlowDialog } from '../ui/dialogs/TagMergeFlowDialog';
import { TagMergeContext } from './TagMergeContext';
import { PrepareClusteringPhase } from './phases/PrepareClusteringPhase';
import { ReviewMergePhase } from './phases/ReviewMergePhase';
import { ApplyMergePhase } from './phases/ApplyMergePhase';
import { TagSuggestionService } from 'src/features/tags/services/TagSuggestionService';
import { TagMergeClusteringOptions } from '../models/TagMergeClusteringOptions';

export class TagMergeUseCase {
  private dialog!: TagMergeFlowDialog;
  private context!: TagMergeContext;
  private suggestionService!: TagSuggestionService;

  constructor(
    private readonly app: App,
    private readonly llmClient: LLMClient,
  ) {}

  /* =========================
   * Entry point
   * ========================= */
  async open(): Promise<void> {
    this.initialize();

    await this.openPreparePhase();
    this.dialog.open();
  }

  /* =========================
   * Initialization
   * ========================= */
  private initialize(): void {
    this.dialog = new TagMergeFlowDialog(this.app);
    this.context = this.createContext();
    this.suggestionService = new TagSuggestionService(this.app, this.llmClient);
  }

  private createContext(): TagMergeContext {
    return new TagMergeContext({
      clusteringOptions: {
        k: 600,
        iterations: 5,
        exclusion: { unregisteredOnly: false },
        priority: { largeClusterThreshold: 10 },
      } as TagMergeClusteringOptions,
    });
  }

  /* =========================
   * Phase transitions
   * ========================= */
  private async openPreparePhase(): Promise<void> {
    const phase = new PrepareClusteringPhase(
      this.app,
      this.llmClient,
      this.dialog,
      this.context,
      () => this.openReviewPhase(),
      () => this.dialog.close(),
    );

    await phase.open();
  }

  private openReviewPhase(): void {
    const phase = new ReviewMergePhase(
      this.app,
      this.dialog,
      this.context,
      this.suggestionService,
      () => this.openApplyPhase(),
      () => this.dialog.close(),
    );

    phase.open();
  }

  private openApplyPhase(): void {
    const phase = new ApplyMergePhase(this.app, this.dialog, this.context, () =>
      this.dialog.close(),
    );

    phase.open();
  }
}
