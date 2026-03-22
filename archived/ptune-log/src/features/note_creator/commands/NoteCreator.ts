import { App, Menu, MenuItem, EventRef, TFolder, Notice } from 'obsidian';
import { ConfigManager } from 'src/config/ConfigManager';
import {
  SerialNoteCreationType,
  NoteCreatorModal,
  NoteCreationInput,
} from '../modals/NoteCreatorModal';
import { NoteCreationService } from '../services/NoteCreationService';
import { Utils } from 'src/core/utils/common/Utils';
import { SnippetCreator } from '../../snippet/SnippetCreator';
import { logger } from 'src/core/services/logger/loggerInstance';
// import { CommonTagGenerator } from '../services/CommonTagGenerator';
import { CommonTagGenerator } from '../services/CommonTagGenerator';
import { LLMClient } from 'src/core/services/llm/client/LLMClient';

/**
 * NoteCreator
 * UI層：メニュー登録・入力検証・モーダル制御を担当。
 */
export class NoteCreator {
  constructor(private app: App, private config: ConfigManager) {}

  /** --- タイトル検証 --- */
  static isValidNoteTitle(title: string): boolean {
    const invalidChars = /[\\/#%&{}<>*? $!':@+`|="]/;
    return !invalidChars.test(title);
  }

  /** --- 入力検証 --- */
  static validateInput(input: Partial<NoteCreationInput>): boolean {
    if (!input.title?.trim()) {
      new Notice('タイトルが未入力です');
      return false;
    }
    if (!this.isValidNoteTitle(input.title)) {
      new Notice('タイトルに無効な文字があります');
      return false;
    }
    return true;
  }

  /** --- メニュー登録 --- */
  registerFileMenuCallback(): EventRef {
    const eventRef = this.app.workspace.on('file-menu', (menu: Menu, file) => {
      if (!(file instanceof TFolder)) return;

      const service = new NoteCreationService(this.app, this.config);

      // --- ノート作成メニュー ---
      menu.addItem((item: MenuItem) => {
        item
          .setTitle('連番付きでノート作成')
          .setIcon('document')
          .onClick(() => {
            const modal = new NoteCreatorModal(
              this.app,
              file,
              this.config,
              SerialNoteCreationType.FILE,
              (result) => {
                // async callback → IIFE で void 化
                void (async () => {
                  if (!NoteCreator.validateInput(result)) return;

                  const noteFile = await service.createNote(result);
                  await this.app.workspace.getLeaf().openFile(noteFile);
                  Utils.focusFileInExplorer(this.app, noteFile);

                  logger.info(
                    `[NoteCreator] note created and opened: ${noteFile.path}`
                  );
                })();
              }
            );
            modal.open(); // ← Promise を返さないので await 禁止
          });
      });

      // --- フォルダ作成メニュー ---
      menu.addItem((item: MenuItem) => {
        item
          .setTitle('連番付きでフォルダ作成')
          .setIcon('document')
          .onClick(() => {
            const modal = new NoteCreatorModal(
              this.app,
              file,
              this.config,
              SerialNoteCreationType.FOLDER,
              (result) => {
                void (async () => {
                  if (!NoteCreator.validateInput(result)) return;
                  await service.createFolderWithIndex(result);
                })();
              }
            );
            modal.open();
          });
      });

      // --- index.md に共通タグを追加 ---
      menu.addItem((item: MenuItem) => {
        item
          .setTitle('index.md に共通タグを追加')
          .setIcon('tag')
          .onClick(() => {
            void (async () => {
              const llmClient = new LLMClient(
                this.app,
                this.config.settings.llm
              );
              const generator = new CommonTagGenerator(this.app, llmClient);
              await generator.applyTagsToIndex(file);
            })();
          });
      });

      // --- スニペットコピー ---
      menu.addItem((item: MenuItem) => {
        item
          .setTitle('スニペットをコピー')
          .setIcon('paste')
          .onClick(() => {
            void (async () => {
              const snippetCreator = new SnippetCreator(this.app, this.config);
              await snippetCreator.saveClipboardToSnippet(file);
            })();
          });
      });
    });

    return eventRef;
  }
}
