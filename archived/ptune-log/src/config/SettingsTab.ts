// File: src/config/SettingsTab.ts

import { App, PluginSettingTab, Setting } from 'obsidian';
import type PtunePlugin from '../../main';
import type { ConfigManager } from './ConfigManager';

import { renderLLMSettings } from './SettingTabLLM';
import { renderNoteSettings } from './SettingsTabNote';
import { renderSnippetSettings } from './SettingsTabSnippet';
import { renderGoogleAuthSettings } from './SettingsTabGoogleAuth';
import { renderReviewSettings } from './SettingTabReview';

import type { LogLevel } from 'src/core/services/logger/Logger';
import { isLang, type Lang } from 'src/i18n/types';
import { i18n } from 'src/i18n';
import { I18nBootstrap } from 'src/i18n/I18nBootstrap';

function isLogLevel(v: string): v is LogLevel {
  return ['debug', 'info', 'warn', 'error', 'none'].includes(v);
}

export class PtuneSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private readonly plugin: PtunePlugin,
    private readonly config: ConfigManager
  ) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    const lang = (this.config.get<string>('ui.language') || 'ja') as Lang;

    /* =========================
     * Language
     * ========================= */
    // const common = i18n.ui.common;
    const common = i18n.ui.common;

    new Setting(containerEl)
      .setName(common.language.name)
      .setDesc(common.language.desc)
      .addDropdown((dropdown) =>
        dropdown
          .addOptions({
            ja: common.language.options.ja,
            en: common.language.options.en,
          })
          .setValue(lang)
          .onChange(async (value) => {
            if (isLang(value)) {
              await this.config.update('ui.language', value);
              I18nBootstrap.initialize(value);
            }
            this.display();
          })
      );

    /* =========================
     * Basic Settings
     * ========================= */
    const settings = i18n.ui.settingsBasic;

    new Setting(containerEl).setName(settings.heading).setHeading();

    new Setting(containerEl)
      .setName(settings.logLevel.name)
      .setDesc(settings.logLevel.desc)
      .addDropdown((dropdown) =>
        dropdown
          .addOptions({
            debug: settings.logLevel.options.debug,
            info: settings.logLevel.options.info,
            warn: settings.logLevel.options.warn,
            error: settings.logLevel.options.error,
            none: settings.logLevel.options.none,
          })
          .setValue(this.config.get<LogLevel>('logLevel'))
          .onChange(async (value) => {
            if (isLogLevel(value)) {
              await this.config.update<LogLevel>('logLevel', value);
            }
            this.display();
          })
      );

    new Setting(containerEl)
      .setName(settings.enableLogFile.name)
      .setDesc(settings.enableLogFile.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.config.get('enableLogFile'))
          .onChange(async (value) => {
            await this.config.update('enableLogFile', value);
            this.display();
          })
      );

    /* =========================
     * Sub Tabs
     * ========================= */
    renderNoteSettings(containerEl, this.config, this.config.settings);
    renderSnippetSettings(containerEl, this.config, this.config.settings);
    renderLLMSettings(containerEl, this.config, this.config.settings, this);
    renderGoogleAuthSettings(containerEl, this.config, this.config.settings);
    renderReviewSettings(containerEl, this.config);
  }
}
