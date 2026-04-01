import type { App } from 'obsidian';
import { logger } from 'src/core/services/logger/loggerInstance';
import { VaultUtils } from 'src/core/utils/common/VaultUtils';

export type UriParams = Record<string, string | undefined>;

/**
 * WinUIアプリ用URIビルダー
 * vault_homeを自動解決し、スキームURIを構築する
 */
export class WinAppUriBuilder {
  static readonly SCHEME = 'net.getperf.ptune.googleoauth';
  static readonly ACTION_LAUNCH = 'launch';
  static readonly ACTION_AUTH = 'auth';
  static readonly ACTION_EXPORT = 'export';
  static readonly ACTION_IMPORT = 'import';
  static readonly ACTION_GET_TASKS_MD = 'get-tasks-md';

  /**
   * URIを構築する（アクション別）
   */
  static build(app: App, action: string, params: UriParams = {}): string {
    logger.debug(`[WinAppUriBuilder.build] action=${action}`);
    const vaultHome = params.vault_home ?? VaultUtils.resolveVaultHome(app);
    const query = new URLSearchParams({ ...params, vault_home: vaultHome });
    const uri = `${this.SCHEME}:/${action}?${query.toString()}`;
    logger.debug(`[WinAppUriBuilder.build] uri=${uri}`);
    return uri;
  }

  /** WinUIアプリ起動用URI生成 */
  static buildLaunch(app: App): string {
    logger.debug('[WinAppUriBuilder.buildLaunch] start');
    const uri = this.build(app, this.ACTION_LAUNCH);
    logger.debug('[WinAppUriBuilder.buildLaunch] done');
    return uri;
  }

  /** Google OAuth認証用URI生成 */
  static buildAuth(app: App): string {
    logger.debug('[WinAppUriBuilder.buildAuth] start');
    const uri = this.build(app, this.ACTION_AUTH);
    logger.debug('[WinAppUriBuilder.buildAuth] done');
    return uri;
  }

  /** タスクエクスポート用URI生成 */
  static buildExport(app: App, input: string): string {
    logger.debug('[WinAppUriBuilder.buildExport] start');
    const uri = this.build(app, this.ACTION_EXPORT, { input });
    logger.debug('[WinAppUriBuilder.buildExport] done');
    return uri;
  }

  /** タスクインポート用URI生成 */
  static buildImport(app: App, output: string): string {
    logger.debug('[WinAppUriBuilder.buildImport] start');
    const uri = this.build(app, this.ACTION_IMPORT, { output });
    logger.debug('[WinAppUriBuilder.buildImport] done');
    return uri;
  }

  static buildGetTasksMd(app: App): string {
    logger.debug('[WinAppUriBuilder.buildGetTasksMd] start');
    const uri = this.build(app, this.ACTION_GET_TASKS_MD);
    logger.debug('[WinAppUriBuilder.buildGetTasksMd] done');
    return uri;
  }
}
