// src/features/tag_merge/ui/TagMergeResultDialog.ts

import { App, Modal } from 'obsidian';
import { TagMergePriorityGroupVM } from '../../models/viewmodels/TagMergePriorityGroupVM';
import { TagSuggestionService } from 'src/features/tags/services/TagSuggestionService';
import { TagMergeResultView } from '../views/result/TagMergeResultView';

/**
 * TagMergeResultDialog
 * - TagMergeResultView の Modal ラッパー
 */
export class TagMergeResultDialog extends Modal {
  private readonly view: TagMergeResultView;

  constructor(
    app: App,
    priorityGroups: TagMergePriorityGroupVM[],
    tagSuggestionService: TagSuggestionService,
  ) {
    super(app);
    this.view = new TagMergeResultView(
      app,
      priorityGroups,
      tagSuggestionService,
    );
  }

  onOpen(): void {
    this.view.render(this.contentEl);
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
