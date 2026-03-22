// src/features/tag_merge/ui/phases/ReviewMergeView.ts

import { Setting, App } from 'obsidian';
import { TagMergePhaseView } from './TagMergePhaseView';
import { TagMergeResultView } from '../views/result/TagMergeResultView';
import { TagMergePriorityGroupVM } from '../../models/viewmodels/TagMergePriorityGroupVM';
import { TagSuggestionService } from 'src/features/tags/services/TagSuggestionService';

export class ReviewMergeView extends TagMergePhaseView {
  constructor(
    private readonly app: App,
    private readonly priorityGroups: TagMergePriorityGroupVM[],
    private readonly tagSuggestionService: TagSuggestionService,
    private readonly onRunMerge: () => void,
    private readonly onCancel: () => void,
  ) {
    super();
  }

  getTitle(): string {
    return '名寄せ候補の確認と修正';
  }

  getDescription() {
    return {
      summary:
        '自動検出されたタグマージ候補を確認し、必要に応じて修正してください。',
    };
  }

  getStatusMessage(): string | undefined {
    return undefined;
  }

  protected renderBody(container: HTMLElement): void {
    const bodyWrapper = container.createDiv({ cls: 'tag-merge-body' });
    const scrollContainer = bodyWrapper.createDiv({
      cls: 'tag-merge-body-scroll',
    });

    new TagMergeResultView(
      this.app,
      this.priorityGroups,
      this.tagSuggestionService,
    ).render(scrollContainer);
  }

  protected renderActions(container: HTMLElement): void {
    const setting = new Setting(container);
    setting.settingEl.addClass('tag-merge-actions');

    setting
      .addButton((btn) =>
        btn
          .setButtonText('タグマージ実行')
          .setCta()
          .onClick(() => {
            this.onRunMerge();
          }),
      )
      .addButton((btn) =>
        btn.setButtonText('キャンセル').onClick(() => {
          this.onCancel();
        }),
      );
  }
}
