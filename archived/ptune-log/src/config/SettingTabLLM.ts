// File: src/config/SettingTabLLM.ts

import { Notice, PluginSettingTab, Setting, TFile } from 'obsidian';
import type { PluginSettings, ConfigManager } from './ConfigManager';
import { providerDefaults } from './settings/LLMSettings';
import { i18n } from 'src/i18n';

export function renderLLMSettings(
  containerEl: HTMLElement,
  config: ConfigManager,
  settings: PluginSettings,
  settingTab: PluginSettingTab,
) {
  const t = i18n.ui.settingsLlm;

  const heading = containerEl.createEl('h3', { text: t.sectionTitle });
  heading.id = 'llm-settings-title';

  const providerSetting = new Setting(containerEl)
    .setName(t.provider.name)
    .setDesc(t.provider.desc);

  providerSetting.addDropdown((drop) =>
    drop
      .addOptions({
        'OpenAI Chat': t.provider.options['OpenAI Chat'],
        'Anthropic Claude': t.provider.options['Anthropic Claude'],
        Gemini: t.provider.options.Gemini,
        Custom: t.provider.options.Custom,
      })
      .setValue(settings.llm.provider)
      .onChange(async (value) => {
        await config.update('llm.provider', value);

        const defaults = providerDefaults[value];
        if (defaults) {
          for (const [key, val] of Object.entries(defaults)) {
            await config.update(`llm.${key}`, val);
          }

          // 既存挙動：再描画＋スクロール
          settingTab.display();
          setTimeout(() => {
            const target = document.getElementById('llm-settings-title');
            if (target) {
              target.scrollIntoView({ behavior: 'auto', block: 'start' });
            }
          }, 50);
        }
      }),
  );

  new Setting(containerEl)
    .setName(t.apiKey.name)
    .setDesc(t.apiKey.desc)
    .addText((text) =>
      text
        .setPlaceholder(t.apiKey.placeholder)
        .setValue(settings.llm.apiKey)
        .onChange(async (value) => {
          await config.update('llm.apiKey', value.trim());
        }),
    );

  new Setting(containerEl)
    .setName(t.baseUrl.name)
    .setDesc(t.baseUrl.desc)
    .addText((text) =>
      text
        .setPlaceholder(settings.llm.baseUrl)
        .setValue(settings.llm.baseUrl)
        .onChange(async (value) => {
          await config.update('llm.baseUrl', value.trim());
        }),
    );

  new Setting(containerEl)
    .setName(t.model.name)
    .setDesc(t.model.desc)
    .addDropdown((drop) =>
      drop
        .addOptions({
          'gpt-3.5-turbo': 'gpt-3.5-turbo',
          'gpt-4o-mini': 'gpt-4o-mini',
          'gpt-4.1-mini': 'gpt-4.1-mini',
          // 'gpt-5.2-mini': 'gpt-5.2-mini',
          'claude-3-5-haiku-20241022': 'claude-3-5-haiku',
          'gemini-2.5-flash': 'gemini-2.5-flash',
          'gemini-2.5-flash-lite': 'gemini-2.5-flash-lite',
        })
        .setValue(settings.llm.model)
        .onChange(async (value) => {
          await config.update('llm.model', value);
        }),
    );

  new Setting(containerEl)
    .setName(t.embeddingModel.name)
    .setDesc(t.embeddingModel.desc)
    .addDropdown((drop) =>
      drop
        .addOptions({
          '': t.embeddingModel.options[''],
          'text-embedding-3-small':
            t.embeddingModel.options['text-embedding-3-small'],
          'text-embedding-3-large':
            t.embeddingModel.options['text-embedding-3-large'],
        })
        .setValue(settings.llm.embeddingModel)
        .onChange(async (value) => {
          await config.update('llm.embeddingModel', value);
        }),
    );

  new Setting(containerEl)
    .setName(t.temperature.name)
    .setDesc(t.temperature.desc)
    .addSlider((slider) =>
      slider
        .setLimits(0, 1, 0.1)
        .setValue(settings.llm.temperature)
        .setDynamicTooltip()
        .onChange(async (value) => {
          await config.update('llm.temperature', value);
        }),
    );

  new Setting(containerEl)
    .setName(t.maxTokens.name)
    .setDesc(t.maxTokens.desc)
    .addText((text) =>
      text
        .setPlaceholder(t.maxTokens.placeholder)
        .setValue(settings.llm.maxTokens.toString())
        .onChange(async (value) => {
          const num = parseInt(value, 10);
          if (!isNaN(num)) {
            await config.update('llm.maxTokens', num);
          }
        }),
    );

  new Setting(containerEl)
    .setName(t.minSimilarityScore.name)
    .setDesc(t.minSimilarityScore.desc)
    .addSlider((slider) =>
      slider
        .setLimits(0, 1, 0.05)
        .setValue(settings.llm.minSimilarityScore ?? 0.2)
        .setDynamicTooltip()
        .onChange(async (value) => {
          await config.update('llm.minSimilarityScore', value);
        }),
    );

  new Setting(containerEl)
    .setName(t.enableChecklist.name)
    .setDesc(t.enableChecklist.desc)
    .addToggle((toggle) =>
      toggle
        .setValue(settings.llm.enableChecklist ?? true)
        .onChange(async (value) => {
          await config.update('llm.enableChecklist', value);
        }),
    );

  const notePath = '_templates/llm/tag_generate.md';
  new Setting(containerEl)
    .setName(t.promptTemplate.name)
    .setDesc(t.promptTemplate.desc(notePath))
    .addButton((btn) =>
      btn
        .setButtonText(t.promptTemplate.buttons.select)
        .setCta()
        .onClick(() => {
          settingTab.app.commands.executeCommandById(
            'ptune-log:llm-select-template',
          );
        }),
    )
    .addButton((btn) =>
      btn
        .setButtonText(t.promptTemplate.buttons.open)
        .setCta()
        .onClick(async () => {
          const file = settingTab.app.vault.getAbstractFileByPath(notePath);
          if (file instanceof TFile) {
            await settingTab.app.workspace.getLeaf(true).openFile(file);
          } else {
            new Notice(t.promptTemplate.noticeNotFound(notePath));
          }
        }),
    );

  new Setting(containerEl)
    .setName(t.promptPreview.name)
    .setDesc(t.promptPreview.desc)
    .addButton((btn) =>
      btn
        .setButtonText(t.promptPreview.button)
        .setCta()
        .onClick(() => {
          try {
            settingTab.app.commands.executeCommandById(
              'ptune-log:preview-llm-tag-prompt',
            );
            new Notice(t.promptPreview.noticeOpen);
          } catch (e) {
            console.error(e);
            new Notice(t.promptPreview.noticeFail);
          }
        }),
    );
}
