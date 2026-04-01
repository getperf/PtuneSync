import { App, Plugin, TFile, Notice } from 'obsidian';
import { logger } from 'src/core/services/logger/loggerInstance';
import { PromptTemplateService } from 'src/core/services/llm/client/PromptTemplateService';
import { LLMClient } from 'src/core/services/llm/client/LLMClient';
import { NoteReviewModal } from '../ui/NoteReviewModal';
import { NoteReviewService } from '../services/NoteReviewService';

export class NoteReviewCommandRegistrar {
  private reviewService: NoteReviewService;
  private promptService: PromptTemplateService;

  constructor(private readonly app: App, private readonly client: LLMClient) {
    this.reviewService = new NoteReviewService(app, client);
    this.promptService = new PromptTemplateService(app.vault);
  }

  register(plugin: Plugin): void {
    logger.debug('[NoteReviewCommandRegistrar] register commands');

    plugin.addCommand({
      id: 'ptune-note-review',
      name: '振り返り: 現在のノートをレビュー',
      callback: async () => {
        const file = this.app.workspace.getActiveFile();
        if (!file) {
          new Notice('アクティブなノートがありません。');
          return;
        }

        try {
          await this.openReviewModal(file);
        } catch (e) {
          logger.error('[NoteReviewCommandRegistrar] error', e);
          new Notice('レビュー処理中にエラーが発生しました');
        }
      },
    });
    plugin.registerEvent(
      this.app.workspace.on('file-menu', (menu, file) => {
        if (file instanceof TFile && file.extension === 'md') {
          menu.addItem((item) =>
            item
              .setTitle('ノートレビュー')
              .setIcon('bot')
              .onClick(() => {
                this.openReviewModal(file);
              })
          );
        }
      })
    );
  }

  /**
   * review modal 実行（preview → UI）
   */
  private openReviewModal(file: TFile): void {
    logger.debug(`[NoteReview] open modal only: ${file.path}`);
    new NoteReviewModal(this.app, this.reviewService, this.client, file).open();
  }
}
