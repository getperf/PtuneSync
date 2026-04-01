// File: src/core/utils/common/PluginUtils.ts
import { App } from 'obsidian';
import { logger } from 'src/core/services/logger/loggerInstance';
import { RequiredPluginInfo } from 'src/features/setup/InitialSetupManager';

export class PluginUtils {
  /** プラグインが有効かどうか */
  static isEnabled(app: App, pluginId: string, isCore: boolean): boolean {
    const enabled = isCore
      ? app.internalPlugins?.plugins?.[pluginId]?.enabled ?? false
      : app.plugins?.enabledPlugins?.has(pluginId) ?? false;

    logger.debug(
      `[PluginUtils.isEnabled] plugin=${pluginId}, core=${isCore}, enabled=${enabled}`
    );
    return enabled;
  }

  /** 任意プラグイン情報を返す */
  static getPlugin(app: App, pluginId: string, isCore: boolean) {
    if (isCore) {
      return app.internalPlugins?.plugins?.[pluginId] ?? null;
    }
    return app.plugins?.plugins?.[pluginId] ?? null;
  }

  /** プラグインの公式URL */
  static getPluginUrl(plugin: RequiredPluginInfo): string {
    return plugin.isCore
      ? `https://help.obsidian.md/Plugins/${encodeURIComponent(plugin.name)}`
      : `https://obsidian.md/plugins?id=${plugin.id}#`;
  }

  /** テーマ検索URL */
  static getThemeUrl(themeName: string): string {
    return `https://obsidian.md/themes?search=${encodeURIComponent(themeName)}`;
  }
}
