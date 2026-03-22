import { App, Modal, Setting } from 'obsidian';
import { MarkdownTaskEntry } from 'src/core/models/tasks/MarkdownTaskEntry';

export class TasksExportModal extends Modal {
  private statusEl!: HTMLElement;

  constructor(
    app: App,
    private tasks: MarkdownTaskEntry[],
    private willReset: boolean,
    private onExecute: (modal: TasksExportModal) => Promise<void>
  ) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h3', { text: 'タスクをエクスポートします' });

    contentEl.createEl('p', {
      text: `対象タスク数: ${this.tasks.length} 件`,
    });

    if (this.willReset) {
      contentEl.createEl('p', {
        text: '※ 既存のGoogle Tasksは削除されてから登録されます。',
        cls: 'tasks-export-warning',
      });
    }

    this.statusEl = contentEl.createEl('div', {
      text: '確認待ち…',
      cls: 'tasks-export-status',
    });

    new Setting(contentEl)
      .addButton((btn) =>
        btn
          .setButtonText('実行')
          .setCta()
          .onClick(async () => {
            btn.setDisabled(true);
            await this.onExecute(this);
          })
      )
      .addButton((btn) =>
        btn.setButtonText('キャンセル').onClick(() => this.close())
      );
  }

  setProgress(msg: string) {
    this.statusEl.setText(`⏳ ${msg}`);
    this.statusEl.removeClass('tasks-export-status-error');
  }

  setCompleted(msg: string) {
    this.statusEl.setText(`✅ ${msg}`);
    this.statusEl.removeClass('tasks-export-status-error');
    setTimeout(() => this.close(), 1500);
  }

  setError(msg: string) {
    this.statusEl.setText(msg);
    // 直接 style.color を使わず、CSS クラスで色変更
    this.statusEl.addClass('tasks-export-status-error');
  }
}
