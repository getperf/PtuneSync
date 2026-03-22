// src/features/tag_merge/ui/TagMergeFlowDialog.ts

import { App, Modal } from 'obsidian';
import { TagMergePhaseView } from '../phases/TagMergePhaseView';

export class TagMergeFlowDialog extends Modal {
  private currentView!: TagMergePhaseView;

  constructor(app: App) {
    super(app);
  }

  onOpen(): void {
    this.render();
  }

  setPhaseView(view: TagMergePhaseView): void {
    this.currentView = view;
    this.render();
  }

  private render(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('tag-merge-flow-modal');

    // PhaseView がレイアウト全体を描画
    this.currentView.render(contentEl);
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
