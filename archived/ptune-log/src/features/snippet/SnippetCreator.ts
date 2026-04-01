import { App, Notice, TFolder, normalizePath, TFile } from 'obsidian';
import { ConfigManager } from 'src/config/ConfigManager';
import { logger } from 'src/core/services/logger/loggerInstance';

export class SnippetCreator {
  constructor(private app: App, private config: ConfigManager) {}

  /** クリップボード内容をスニペットファイルに保存する */
  async saveClipboardToSnippet(folder: TFolder): Promise<void> {
    const filename =
      this.config.get<string>('snippet.filename') || 'snippet.md';
    const folderPath = normalizePath(folder.path);
    const filePath = `${folderPath}/${filename}`;
    logger.debug('[SnippetCreator.saveClipboardToSnippet] target file', {
      filePath,
    });

    const vault = this.app.vault;

    // クリップボード読み取り
    let clipboard = '';
    try {
      clipboard = await navigator.clipboard.readText();
    } catch (e) {
      logger.error(
        '[SnippetCreator.saveClipboardToSnippet] clipboard read failed',
        e
      );
      new Notice('Failed to read clipboard');
      return;
    }

    if (!clipboard) {
      logger.warn('[SnippetCreator.saveClipboardToSnippet] clipboard empty');
      new Notice('Clipboard is empty');
      return;
    }

    // 既存 snippet.md の読み込みと番号判定
    let count = 0;
    let prev = '';
    const existing = vault.getAbstractFileByPath(filePath);
    if (existing instanceof TFile) {
      prev = await vault.read(existing);
      const matches = [...prev.matchAll(/^#*\s*clipboard_(\d+)/gm)];
      if (matches.length > 0) {
        const last = matches[matches.length - 1];
        count = parseInt(last[1], 10);
      }
      logger.debug(
        '[SnippetCreator.saveClipboardToSnippet] existing snippet found',
        { count }
      );
    } else {
      logger.debug(
        '[SnippetCreator.saveClipboardToSnippet] no existing snippet'
      );
    }

    // 次の番号決定
    count++;
    const header = `# clipboard_${String(count).padStart(2, '0')}\n`;

    // コードブロック判定
    let content = clipboard.trim();
    if (!content.includes('```')) {
      content = `${header}\n\`\`\`\n${content}\n\`\`\`\n`;
    } else {
      content = `${header}\n${content}\n`;
    }
    logger.debug('[SnippetCreator.saveClipboardToSnippet] content prepared', {
      count,
    });

    // ファイル書き込み処理
    try {
      if (existing instanceof TFile) {
        await vault.modify(existing, prev + '\n' + content);
        new Notice(`Snippet appended to ${filename}`);
      } else {
        await vault.create(filePath, content);
        logger.info(
          '[SnippetCreator.saveClipboardToSnippet] snippet file created',
          { filename }
        );
        new Notice(`Snippet file created: ${filename}`);
      }
    } catch (e) {
      logger.error(
        '[SnippetCreator.saveClipboardToSnippet] file write failed',
        e
      );
      new Notice('Failed to write snippet file');
    }

    logger.debug('[SnippetCreator.saveClipboardToSnippet] complete');
  }
}
