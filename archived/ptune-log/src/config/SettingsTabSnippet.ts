// File: src/config/SettingsTabSnippet.ts

import { Setting } from 'obsidian';
import type { ConfigManager, PluginSettings } from './ConfigManager';
import { i18n } from 'src/i18n';

export function renderSnippetSettings(
  containerEl: HTMLElement,
  config: ConfigManager,
  settings: PluginSettings
) {
  // --- i18n（既存キー構造を完全維持） ---
  const t = i18n.ui.settingsSnippet;

  new Setting(containerEl)
    .setName(t.snippetFile.name)
    .setDesc(t.snippetFile.desc)
    .addText((text) =>
      text
        .setPlaceholder(t.snippetFile.placeholder)
        .setValue(settings.snippet.filename)
        .onChange(async (value) => {
          // ★ 既存仕様：空文字は 'snippet.md' にフォールバック
          await config.update('snippet.filename', value.trim() || 'snippet.md');
        })
    );
}
