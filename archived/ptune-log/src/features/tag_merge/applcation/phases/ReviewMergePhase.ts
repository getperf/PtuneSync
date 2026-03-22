// features/tag_merge/application/phases/ReviewMergePhase.ts

import { App } from 'obsidian';
import { TagMergeFlowDialog } from '../../ui/dialogs/TagMergeFlowDialog';
import { ReviewMergeView } from '../../ui/phases/ReviewMergeView';
import { TagMergeContext } from '../TagMergeContext';
import { TagSuggestionService } from 'src/features/tags/services/TagSuggestionService';

export class ReviewMergePhase {
  constructor(
    private readonly app: App,
    private readonly dialog: TagMergeFlowDialog,
    private readonly context: TagMergeContext,
    private readonly tagSuggestionService: TagSuggestionService,
    private readonly onNext: () => void,
    private readonly onCancel: () => void,
  ) {}

  open(): void {
    const view = new ReviewMergeView(
      this.app,
      this.context.priorityGroups,
      this.tagSuggestionService,
      () => this.onNext(),
      () => this.onCancel(),
    );

    this.dialog.setPhaseView(view);
  }
}
