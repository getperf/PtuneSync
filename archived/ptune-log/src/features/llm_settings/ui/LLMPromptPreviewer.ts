import { App, Modal } from 'obsidian';
import { logger } from 'src/core/services/logger/loggerInstance';

import { TagAliases } from 'src/core/models/tags/TagAliases';
import { TagRankService } from 'src/features/tags/services/TagRankService';
import { PromptTemplateService } from 'src/core/services/llm/client/PromptTemplateService';

/**
 * LLMタグ生成用プロンプトをプレビュー表示する
 */
export class LLMPromptPreviewer {
  constructor(private readonly app: App) { }

  async showPromptPreview(): Promise<void> {
    try {
      const promptService = new PromptTemplateService(this.app.vault);
      const aliases = new TagAliases();
      await aliases.load(this.app.vault);
      const topTags = await new TagRankService(this.app).getFormattedTopTags();

      const prompt = await promptService.mergeSystemAndUser(
        '_templates/llm/system/tag_generate_system.md',
        '_templates/llm/tag_generate.md',
        { TOP_TAGS: topTags }
      );

      new PromptPreviewModal(this.app, prompt).open();
      logger.debug('[LLMPromptPreviewer] preview displayed');
    } catch (e) {
      logger.error('[LLMPromptPreviewer] failed to load prompt', e);
    }
  }
}

/**
 * プロンプト内容をモーダルで表示
 */
class PromptPreviewModal extends Modal {
  constructor(app: App, private readonly prompt: string) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl('h3', { text: 'LLMタグ生成プロンプトプレビュー' });
    const textarea = contentEl.createEl('textarea', {
      text: this.prompt,
    });
    textarea.setAttr('style', 'width:100%;height:400px;font-family:monospace;');
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
