import { App, Notice, Platform, Plugin, normalizePath } from 'obsidian';
import { logger } from 'src/core/services/logger/loggerInstance';

import { SetupWizardDialog } from './SetupWizardDialog';
import { NoteSetupHelper } from './NoteSetupHelper';
import { WinAppLauncher } from '../google_tasks/win/WinAppLauncher';
import { VaultUtils } from 'src/core/utils/common/VaultUtils';
import { PluginUtils } from 'src/core/utils/common/PluginUtils';

export interface RequiredPluginInfo {
  id: string;
  isCore: boolean; // Obsidian コアプラグインかどうか
  name: string;
  version: string;
  mustBeDisabled?: boolean;
}

export class InitialSetupManager {
  private requiredPlugins: RequiredPluginInfo[] = [
    { id: 'bases', isCore: true, name: 'Bases', version: '1.0.0' },
    { id: 'outline', isCore: true, name: 'Outline', version: '1.0.0' },
    { id: 'tag-pane', isCore: true, name: 'Tag Pane', version: '1.0.0' },
    {
      id: 'daily-notes',
      isCore: true,
      name: 'Daily Notes',
      version: '1.0.0',
    },
    {
      id: 'tag-wrangler',
      isCore: false,
      name: 'Tag Wrangler',
      version: '0.7.0',
      mustBeDisabled: true,
    },
    {
      id: 'obsidian-outliner',
      isCore: false,
      name: 'Outliner',
      version: '1.0.0',
    },
    {
      id: 'calendar',
      isCore: false,
      name: 'Calendar',
      version: '1.0.0',
    },
  ];

  constructor(private app: App, private noteHelper: NoteSetupHelper) {}

  getInvalidCorePlugins(): RequiredPluginInfo[] {
    return this.getInvalidPlugins().filter((p) => p.isCore);
  }

  getInvalidCustomPlugins(): RequiredPluginInfo[] {
    return this.getInvalidPlugins().filter((p) => !p.isCore);
  }

  getInvalidPlugins(): RequiredPluginInfo[] {
    const invalid: RequiredPluginInfo[] = [];
    for (const p of this.requiredPlugins) {
      const isEnabled = PluginUtils.isEnabled(this.app, p.id, p.isCore);
      if (p.mustBeDisabled) {
        if (isEnabled) invalid.push(p);
      } else {
        if (!isEnabled) invalid.push(p);
      }
    }
    return invalid;
  }

  register(plugin: Plugin): void {
    plugin.addCommand({
      id: 'initial-setup-note',
      name: 'ノートの初期セットアップ',
      callback: () => {
        new SetupWizardDialog(plugin, this, this.noteHelper).open();
      },
    });
  }

  async getMissingTheme(): Promise<string | null> {
    const theme = await VaultUtils.getCurrentTheme(this.app);
    return theme !== 'Minimal' ? 'Minimal' : null;
  }

  /**
   * テーマがMinimalでなければエラーメッセージを返す
   */
  async checkTheme(): Promise<string | null> {
    const theme = await VaultUtils.getCurrentTheme(this.app);

    if (theme !== 'Minimal') {
      return `外観 > テーマ > コミュニティテーマ で Minimal を検索してインストールしてください。\nGitHub: https://github.com/kepano/obsidian-minimal`;
    } else {
      return null;
    }
  }

  /**
   * デイリーノートの設定ファイル (configDir/daily-notes.json) の存在を確認
   */
  async isDailyNoteConfigured(): Promise<boolean> {
    const adapter = this.app.vault.adapter;

    // ← 修正ポイント（app.vault.configDir を使用）
    const path = normalizePath(`${this.app.vault.configDir}/daily-notes.json`);

    return await adapter.exists(path);
  }

  /**
   * PtuneSync インストール・動作確認チェック
   * Windows 環境のみ有効
   */
  async checkPtuneSync(): Promise<{ available: boolean; verified: boolean }> {
    const isWindows = Platform.isWin;

    if (!isWindows) {
      logger.info(
        '[InitialSetup] 非Windows環境のため、PtuneSync確認をスキップします。'
      );
      return { available: false, verified: false };
    }

    const launcher = new WinAppLauncher(this.app.vault);
    const verified = await launcher.isSuccess(); // status=success 確認

    if (verified) {
      logger.info('[InitialSetup] PtuneSync が動作確認済みです。');
    } else {
      logger.warn(
        '[InitialSetup] PtuneSync が未検出、または status.json が success ではありません。'
      );
    }

    return { available: true, verified };
  }

  async checkAll(): Promise<void> {
    const missingPlugins: string[] = [];

    for (const plugin of this.requiredPlugins) {
      const enabled = PluginUtils.isEnabled(this.app, plugin.id, plugin.isCore);
      if (plugin.mustBeDisabled) {
        if (enabled) missingPlugins.push(plugin.name);
      } else {
        if (!enabled) missingPlugins.push(plugin.name);
      }
    }

    const themeError = await this.checkTheme();
    const isDailyNoteConfigured = await this.isDailyNoteConfigured();
    const hasError =
      missingPlugins.length > 0 || themeError || !isDailyNoteConfigured;

    if (hasError) {
      new Notice(
        '必須の設定に問題があります。詳細はコマンド『ノートの初期セットアップ』で確認してください。',
        8000
      );

      if (missingPlugins.length > 0) {
        logger.warn(`無効なプラグイン: ${missingPlugins.join(', ')}`);
      } else {
        logger.info('すべての必須プラグインが有効です。');
      }

      if (themeError) {
        logger.warn(`テーマエラー: ${themeError}`);
      } else {
        logger.info('Minimal テーマが使用されています。');
      }
      if (!isDailyNoteConfigured) {
        logger.warn('デイリーノートの設定ファイルが見つかりません。');
      } else {
        logger.info('デイリーノートの設定ファイルは構成されています。');
      }
    } else {
      logger.info('すべてのプラグインとテーマが正しく構成されています。');
    }
  }
}
