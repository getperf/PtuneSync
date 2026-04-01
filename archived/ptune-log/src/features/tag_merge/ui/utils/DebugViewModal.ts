// File: src/features/tag_merge/ui/utils/DebugViewModal.ts

import { App, Modal, Notice } from 'obsidian';

/**
 * DebugViewModal
 * - 任意のデバッグテキストを表示する汎用モーダル
 * - クリップボードコピー機能付き
 */
export class DebugViewModal extends Modal {
  constructor(
    app: App,
    private readonly title: string,
    private readonly text: string,
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();

    // --- Header ---
    const header = contentEl.createDiv({ cls: 'debug-view-header' });
    header.createEl('h3', { text: this.title });

    // --- Copy button ---
    const copyBtn = header.createEl('button', {
      text: 'Copy to Clipboard',
    });
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(this.text);
        new Notice('Copied to clipboard');
      } catch {
        new Notice('Failed to copy to clipboard');
      }
    });

    // --- Body ---
    const pre = contentEl.createEl('pre');
    pre.style.whiteSpace = 'pre-wrap';
    pre.style.maxHeight = '60vh';
    pre.style.overflowY = 'auto';
    pre.setText(this.text);
  }
}
