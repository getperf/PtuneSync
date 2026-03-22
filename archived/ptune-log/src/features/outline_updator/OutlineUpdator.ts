import { Notice, Plugin, TFile, App } from 'obsidian';
import { OutlineHeadingResolver } from './OutlineHeadingResolver';
import { OutlineUpdatorModal } from './OutlineUpdatorModal';
import { OutlineContents } from './OutlineContents';
import { OutlineHeading } from './OutlineHeading';
import { logger } from 'src/core/services/logger/loggerInstance';

export class OutlineUpdator {
  private app: App;
  constructor(private plugin: Plugin) {
    this.app = plugin.app;
  }

  /** 見出しレベル一括変更コマンドを登録する */
  regist(): void {
    this.plugin.addCommand({
      id: 'edit-outline-heading-level',
      name: 'ノートの見出しレベル一括変更',
      editorCallback: (editor, view) => {
        if (!view.file) {
          logger.warn('[OutlineUpdator.regist] no active file');
          return;
        }
        const file = view.file;
        logger.debug('[OutlineUpdator.regist] target file', {
          file: file.path,
        });

        const cursorLine = editor.getCursor().line;
        const headings = OutlineHeadingResolver.getHeadings(this.app, file);
        logger.debug('[OutlineUpdator.regist] headings count', {
          count: headings.length,
        });

        const startIndex = headings.findIndex((h) => h.line > cursorLine);
        const endIndex = headings.length - 1;
        logger.debug('[OutlineUpdator.regist] heading range', {
          startIndex,
          endIndex,
        });

        const contents = new OutlineContents(headings, startIndex, endIndex);

        new OutlineUpdatorModal(this.app, contents, (updated) => {
          void this.applyUpdate(file, updated);
        }).open();
      },
    });
    logger.debug('[OutlineUpdator.regist] command registered');
  }

  /** 見出し内容の更新をファイルへ適用する */
  async applyUpdate(file: TFile, contents: OutlineContents): Promise<void> {
    const original = await this.app.vault.read(file);
    const lines = original.split('\n');

    const updatedMap = new Map<number, OutlineHeading>();
    for (const heading of contents.headings) {
      updatedMap.set(heading.line, heading);
    }

    const newLines = lines.map((line, index) => {
      const heading = updatedMap.get(index);
      if (!heading) return line;

      const updatedLine = '#'.repeat(heading.level) + ' ' + heading.text;
      if (line !== updatedLine) {
        logger.debug('[OutlineUpdator.applyUpdate] heading updated', {
          line: index,
          text: heading.text,
        });
      }
      return line !== updatedLine ? updatedLine : line;
    });

    await this.app.vault.modify(file, newLines.join('\n'));
    logger.info('[OutlineUpdator.applyUpdate] headings updated', {
      file: file.path,
    });
    new Notice('見出しを更新しました');
  }
}
