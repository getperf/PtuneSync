import { App, Modal, Notice } from 'obsidian';
import { TasksWinExporter } from './TasksWinExporter';
import type { LauncherProgress } from './WinAppLauncher';
import { logger } from 'src/core/services/logger/loggerInstance';

/**
 * WinUI タスクエクスポートモーダル
 * - デイリーノートからタスクをエクスポートし、WinUI アプリを呼び出す
 */
export class GoogleTasksExportModal extends Modal {
  private statusEl!: HTMLElement;
  private buttonContainer!: HTMLElement;

  constructor(app: App) {
    super(app);
  }

  onOpen() {
    logger.debug('[GoogleTasksExportModal.onOpen] start');
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h3', { text: 'WinUI タスクエクスポート' });
    contentEl.createEl('p', {
      text: '今日のデイリーノートからタスクをエクスポートします。',
    });
    contentEl.createEl('p', {
      text: '※ 既存の Google Tasks は削除されてから登録されます。',
      attr: { style: 'color: var(--text-muted); font-size: 0.9em;' },
    });

    this.statusEl = contentEl.createDiv({
      text: '準備中...',
      attr: {
        style:
          'margin-top: 1em; padding: 8px; background-color: var(--background-secondary); border-radius: 4px;',
      },
    });

    this.buttonContainer = contentEl.createDiv({
      attr: {
        style:
          'display: flex; justify-content: flex-end; gap: 8px; margin-top: 1.5em;',
      },
    });

    const runBtn = this.buttonContainer.createEl('button', { text: '実行' });
    const cancelBtn = this.buttonContainer.createEl('button', {
      text: 'キャンセル',
    });

    runBtn.onclick = async () => await this.runExport(cancelBtn, runBtn);
    cancelBtn.onclick = () => {
      this.statusEl.setText('キャンセルしました。');
      this.close();
    };
    logger.debug('[GoogleTasksExportModal.onOpen] done');
  }

  /**
   * WinUIエクスポートを実行
   */
  private async runExport(cancelBtn: HTMLElement, runBtn: HTMLElement) {
    logger.info('[GoogleTasksExportModal.runExport] start');
    this.statusEl.setText('エクスポートを開始...');
    cancelBtn.setAttribute('disabled', 'true');
    runBtn.setAttribute('disabled', 'true');

    const exporter = new TasksWinExporter(this.app);
    const onProgress = (p: LauncherProgress) =>
      this.statusEl.setText(p.message);

    const result = await exporter.exportFromDaily(onProgress);
    if (result) {
      this.statusEl.setText('完了しました。');
      new Notice('タスクエクスポートが正常に完了しました');
      logger.info('[GoogleTasksExportModal.runExport] success');
    } else {
      this.statusEl.setText('エラーが発生しました。');
      new Notice('タスクエクスポートに失敗しました');
      logger.error('[GoogleTasksExportModal.runExport] failed');
    }

    setTimeout(() => this.close(), 1500);
  }

  onClose() {
    this.contentEl.empty();
  }
}
