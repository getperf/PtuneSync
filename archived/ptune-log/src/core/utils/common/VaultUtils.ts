// File: src/core/utils/common/VaultUtils.ts
import { App, normalizePath, Vault } from 'obsidian';
import { logger } from 'src/core/services/logger/loggerInstance';

export class VaultUtils {
  /** Vault の home ディレクトリの実パス */
  static resolveVaultHome(app: App): string {
    const basePath = app.vault.adapter.basePath ?? '';
    return basePath;
  }

  /** Vault の config ディレクトリの実パス (.obsidian ではない可能性あり) */
  static getConfigDir(app: App): string {
    const cfg = normalizePath(app.vault.configDir);
    logger.debug(`[VaultUtils.getConfigDir] ${cfg}`);
    return cfg;
  }

  /** configDir 配下のパスを組み立てる */
  static getConfigPath(app: App, relative: string): string {
    const path = normalizePath(`${VaultUtils.getConfigDir(app)}/${relative}`);
    logger.debug(`[VaultUtils.getConfigPath] ${path}`);
    return path;
  }

  static getConfigPathFromVault(vault: Vault, relative: string): string {
    const cfg = normalizePath(vault.configDir);
    return normalizePath(`${cfg}/${relative}`);
  }

  /** appearance.json のパス */
  static getAppearanceJsonPath(app: App): string {
    return VaultUtils.getConfigPath(app, 'appearance.json');
  }

  /** 現在のテーマ名を取得 */
  static async getCurrentTheme(app: App): Promise<string | null> {
    const path = VaultUtils.getAppearanceJsonPath(app);
    logger.debug(`[VaultUtils.getCurrentTheme] reading ${path}`);

    try {
      const content = await app.vault.adapter.read(path);
      const json = JSON.parse(content);
      const theme = json.cssTheme || null;
      logger.debug(`[Utils.getCurrentTheme] current theme=${theme}`);
      return theme;
    } catch (err) {
      logger.error('[Utils.getCurrentTheme] 読み込み失敗', err);
      return null;
    }
  }

}
