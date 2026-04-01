// src/features/tag_merge/ui/phases/ApplyMergeView.ts

import { Setting } from 'obsidian';
import { TagMergePhaseView } from './TagMergePhaseView';
import { RenameExecutionState } from '../../services/tag_rename/RenameOperationExecutor';

export class ApplyMergeView extends TagMergePhaseView {
  private status = 'タグマージの準備ができました';

  constructor(
    private readonly onExecute: () => void,
    private readonly onCancel: () => void,
  ) {
    super();
  }

  getTitle(): string {
    return 'タグマージ';
  }

  getDescription() {
    return { summary: '選択されたタグを一括でリネームします。' };
  }

  getStatusMessage(): string | undefined {
    return this.status;
  }

  /** Phase から呼ばれる進捗更新 */
  updateProgress(state: RenameExecutionState): void {
    this.updateStatus(
      `実行中: ${state.executed}/${state.total}（エラー: ${state.failed}）`,
    );
  }

  updateDone(): void {
    this.updateStatus('タグマージが完了しました');
  }

  protected renderBody(_container: HTMLElement): void {
    // 本文なし（最小構成）
  }

  protected renderActions(container: HTMLElement): void {
    const setting = new Setting(container);
    setting.settingEl.addClass('tag-merge-actions');

    setting
      .addButton((btn) =>
        btn
          .setButtonText('実行')
          .setCta()
          .onClick(() => {
            this.status = 'タグマージ実行中...';
            this.updateStatus(this.status);
            this.onExecute();
          }),
      )
      .addButton((btn) =>
        btn.setButtonText('キャンセル').onClick(this.onCancel),
      );
  }
}
