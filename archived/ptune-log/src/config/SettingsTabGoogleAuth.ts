// File: src/config/SettingsTabGoogleAuth.ts

import { Setting } from 'obsidian';
import type { PluginSettings, ConfigManager } from './ConfigManager';
import { i18n } from 'src/i18n/singleton';

export function renderGoogleAuthSettings(
  containerEl: HTMLElement,
  config: ConfigManager,
  settings: PluginSettings
) {
  // --- 既存セクションがあれば削除（既存挙動を維持） ---
  const section = containerEl.querySelector('.google-auth-section');
  if (section) section.remove();

  // --- i18n（既存キー構造をそのまま使用） ---
  const t = i18n.ui.settingsGoogleAuth;

  // --- 新規セクション作成 ---
  const newSection = containerEl.createDiv({ cls: 'google-auth-section' });
  newSection.createEl('h3', { text: t.sectionTitle });

  // --- Windows アプリ利用トグル ---
  new Setting(newSection)
    .setName(t.useWinApp.name)
    .setDesc(t.useWinApp.desc)
    .addToggle((toggle) =>
      toggle
        .setValue(settings.google_auth.useWinApp)
        .onChange(async (value) => {
          await config.update('google_auth.useWinApp', value);

          renderGoogleAuthSettings(containerEl, config, config.settings);
        })
    );

  // --- useWinApp 有効時は入力欄を無効化（既存仕様） ---
  const disabled = settings.google_auth.useWinApp;

  // --- Client ID ---
  new Setting(newSection)
    .setName(t.clientId.name)
    .setDesc(t.clientId.desc)
    .addText((text) =>
      text
        .setPlaceholder(t.clientId.placeholder)
        .setValue(settings.google_auth.clientId)
        .setDisabled(disabled)
        .onChange(async (value) => {
          await config.update('google_auth.clientId', value.trim());
        })
    );

  // --- Client Secret ---
  new Setting(newSection)
    .setName(t.clientSecret.name)
    .setDesc(t.clientSecret.desc)
    .addText((text) =>
      text
        .setPlaceholder(t.clientSecret.placeholder)
        .setValue(settings.google_auth.clientSecret)
        .setDisabled(disabled)
        .onChange(async (value) => {
          await config.update('google_auth.clientSecret', value.trim());
        })
    );
}
