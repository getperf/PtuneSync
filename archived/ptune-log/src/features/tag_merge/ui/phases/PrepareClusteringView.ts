// File: src/features/tag_merge/ui/phases/PrepareClusteringView.ts

import { Setting } from 'obsidian';
import { TagMergePhaseView } from './TagMergePhaseView';
import { TagMergeClusteringOptions } from '../../models/TagMergeClusteringOptions';
import { TagMergeDebugOptions } from '../../applcation/TagMergeContext';

export class PrepareClusteringView extends TagMergePhaseView {
  private unregisteredOnly: boolean;
  private rebuildDb: boolean;
  private showRenameCandidateDebug: boolean;

  constructor(
    private readonly onRun: (
      options: TagMergeClusteringOptions,
      rebuildDb: boolean,
    ) => Promise<void>,
    private readonly onCancel: () => void,
    private readonly messages: string[],
    initialOptions: TagMergeClusteringOptions,
    hasDiff: boolean,
  ) {
    super();
    this.unregisteredOnly = initialOptions.exclusion.unregisteredOnly;
    this.rebuildDb = hasDiff;
    this.showRenameCandidateDebug = false; // 初期値（Context 側で上書き可能）
  }

  getTitle(): string {
    return 'クラスタリング準備';
  }

  getDescription() {
    return {
      summary: '差分を確認し、クラスタリング条件を指定します。',
    };
  }

  protected renderBody(container: HTMLElement): void {
    // new Setting(container)
    //   .setName('未登録タグのみを対象にする')
    //   .setDesc('Tag DB に未登録のタグのみをクラスタリング対象にします')
    //   .addToggle((t) =>
    //     t.setValue(this.unregisteredOnly).onChange((v) => {
    //       this.unregisteredOnly = v;
    //     }),
    //   );

    new Setting(container)
      .setName('クラスタリング前に DB を更新する')
      .setDesc('差分検知結果に基づき Tag DB / Vector DB を再構築します')
      .addToggle((t) =>
        t.setValue(this.rebuildDb).onChange((v) => {
          this.rebuildDb = v;
        }),
      );

    new Setting(container)
      .setName('Rename 候補のデバッグ表示を有効にする')
      .setDesc('RenameCandidate の JSON をデバッグモーダルで表示します')
      .addToggle((t) =>
        t.setValue(this.showRenameCandidateDebug).onChange((v) => {
          this.showRenameCandidateDebug = v;
        }),
      );

    for (const msg of this.messages) {
      container.createEl('div', { text: msg });
    }
  }

  protected renderActions(container: HTMLElement): void {
    new Setting(container)
      .addButton((btn) =>
        btn
          .setButtonText('クラスタリング実行')
          .setCta()
          .onClick(async () => {
            await this.onRun(this.buildOptions(), this.rebuildDb);
          }),
      )
      .addButton((btn) =>
        btn.setButtonText('キャンセル').onClick(this.onCancel),
      );
  }

  getDebugOptions(): TagMergeDebugOptions {
    return {
      showWorkDataDebug: this.showRenameCandidateDebug,
    };
  }

  private buildOptions(): TagMergeClusteringOptions {
    return {
      k: 0, // ★ Phase 側で必ず再決定
      iterations: 5,
      exclusion: { unregisteredOnly: this.unregisteredOnly },
      priority: { largeClusterThreshold: 10 },
    };
  }
}
