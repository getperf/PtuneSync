// File: src/features/llm_settings/commands/LLMSettingsCommandRegistrar.ts
import { App, Plugin } from 'obsidian';
import { logger } from 'src/core/services/logger/loggerInstance';
import { PromptTemplateManager } from 'src/core/services/prompts/PromptTemplateManager';
import { LLMPromptPreviewer } from '../ui/LLMPromptPreviewer';

/**
 * LLMSettingsCommandRegistrar
 *
 * - LLM プロンプトテンプレートの管理
 * - プロンプト内容の確認（プレビュー）
 */
export class LLMSettingsCommandRegistrar {
  private readonly promptManager: PromptTemplateManager;

  constructor(private readonly app: App) {
    this.promptManager = new PromptTemplateManager(app);
  }

  register(plugin: Plugin): void {
    logger.debug('[LLMSettingsCommandRegistrar.register] start');

    // --- テンプレート選択 ---
    plugin.addCommand({
      id: 'llm-settings-select-template',
      name: 'LLM設定: プロンプトテンプレートを選択',
      callback: () => {
        logger.debug('[LLMSettingsCommandRegistrar] select-template');
        this.promptManager.updateTemplate();
      },
    });

    // --- プロンプトプレビュー ---
    plugin.addCommand({
      id: 'llm-settings-preview-prompt',
      name: 'LLM設定: プロンプトをプレビュー',
      callback: async () => {
        logger.debug('[LLMSettingsCommandRegistrar] preview-prompt');
        const previewer = new LLMPromptPreviewer(this.app);
        await previewer.showPromptPreview();
      },
    });

    logger.debug('[LLMSettingsCommandRegistrar.register] complete');
  }
}
