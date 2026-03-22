// File: src/features/google_tasks/win/WinAppLauncher.ts
// Electron shell is used because we must launch the external WinUI application
// via custom URI scheme (net.getperf.ptune.googleoauth:/...).
// This API is only available on Desktop Obsidian (Electron environment).
// Mobile environments do not provide the 'electron' module.

import { normalizePath, Vault } from 'obsidian';
// Electron import must be optional to avoid runtime errors on mobile
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { shell } from 'electron';
import { logger } from 'src/core/services/logger/loggerInstance';

export interface LauncherProgress {
  status: string;
  message: string;
}

interface StatusFile {
  timestamp: string;
  status: string;
  operation?: string;
  message?: string;
}

/**
 * WinUIアプリ起動＋完了確認クラス
 * - 起動後、status.json の timestamp 更新を確認（開始検知）
 * - 起動成功後、status.json の status: success/error まで監視（完了検知）
 */
export class WinAppLauncher {
  private readonly STATUS_FILE: string;
  private readonly START_RETRY_MAX = 4;
  private readonly POLL_INTERVAL_MS = 1000;
  private readonly COMPLETE_TIMEOUT_MS = 90000;
  private readonly START_WAIT_MS = 1000;

  /** --- 単発完了型プロトコル一覧 */
  private static readonly SINGLE_SHOT_OPERATIONS = new Set<string>([
    'get-tasks-md',
  ]);

  constructor(private vault: Vault) {
    const configDir = vault.configDir; // ".obsidian"
    this.STATUS_FILE = normalizePath(
      `${configDir}/plugins/ptune-log/work/status.json`
    );
  }

  /**
   * メイン実行：WinUI アプリを URI で起動し、完了まで監視
   */
  async launchAndWait(
    uri: string,
    op = 'export',
    onProgress?: (p: LauncherProgress) => void
  ): Promise<boolean> {
    logger.info(`[WinAppLauncher.launchAndWait] ${op} 開始`);
    const baseline = new Date();

    const started = await this.waitForStart(uri, baseline);
    if (!started) {
      logger.warn(`[WinAppLauncher.launchAndWait] ${op} 起動検出失敗`);
      onProgress?.({
        status: 'error',
        message: 'アプリ起動を検出できませんでした',
      });
      return false;
    }

    const completed = await this.waitForCompletion(op, baseline, onProgress);
    logger.info(`[WinAppLauncher.launchAndWait] ${op} 完了: ${completed}`);
    logger.debug('[WinAppLauncher.launchAndWait] done');
    return completed;
  }

  // 追加：完了後に status.json を返す
  async launchWaitAndGetStatus(
    uri: string,
    op = 'export',
    onProgress?: (p: LauncherProgress) => void
  ): Promise<StatusFile | null> {
    const ok = await this.launchAndWait(uri, op, onProgress);
    if (!ok) return null;
    const s = await this.getStatus();
    return s;
  }

  /** status.json の内容を取得 */
  async getStatus(): Promise<StatusFile | null> {
    const path = normalizePath(this.STATUS_FILE);
    try {
      const exists = await this.vault.adapter.exists(path);
      if (!exists) return null;
      const json = await this.vault.adapter.read(path);
      return JSON.parse(json) as StatusFile;
    } catch {
      return null;
    }
  }

  /**
   * 成功状態を確認（operation指定も可能）
   * @param op 例: "export" | "import" | "auth"
   */
  async isSuccess(op?: string): Promise<boolean> {
    const s = await this.getStatus();
    if (!s) return false;
    if (op && s.operation !== op) return false;
    return s.status === 'success';
  }

  /**
   * 起動検出：status.json の更新 (timestamp) を確認
   */
  private async waitForStart(uri: string, baseline: Date): Promise<boolean> {
    logger.debug('[WinAppLauncher.waitForStart] start');
    for (let attempt = 1; attempt <= this.START_RETRY_MAX; attempt++) {
      logger.debug(`[WinAppLauncher.waitForStart] attempt ${attempt}`);
      const launched = await this.openUri(uri);
      if (!launched) continue;

      await this.delay(this.START_WAIT_MS);
      if (await this.isStatusFileUpdated(baseline)) {
        logger.debug('[WinAppLauncher.waitForStart] launch detected');
        return true;
      }
    }
    logger.warn('[WinAppLauncher.waitForStart] 起動検出タイムアウト');
    return false;
  }

  /**
   * 完了検出：status.json の status: success/error を監視
   */
  private async waitForCompletion(
    op: string,
    baseline: Date,
    onProgress?: (p: LauncherProgress) => void
  ): Promise<boolean> {
    logger.debug('[WinAppLauncher.waitForCompletion] start');
    const timeoutAt = Date.now() + this.COMPLETE_TIMEOUT_MS;
    let lastText = '';

    const isSingleShot = WinAppLauncher.SINGLE_SHOT_OPERATIONS.has(op);

    while (Date.now() < timeoutAt) {
      const status = await this.readStatus();
      if (!status || !this.isNewer(status, baseline)) {
        await this.delay(this.POLL_INTERVAL_MS);
        continue;
      }

      const text = `${status.status}:${status.message ?? ''}`;
      if (text !== lastText) {
        logger.info(
          `[WinAppLauncher.waitForCompletion] status=${status.status} message=${status.message}`
        );
        onProgress?.({ status: status.status, message: status.message ?? '' });
        lastText = text;
      }

      // --- 単発完了型：最初の success / error で即終了
      if (isSingleShot) {
        if (status.status === 'success') {
          logger.debug(
            '[WinAppLauncher.waitForCompletion] single-shot success'
          );
          return true;
        }
        if (status.status === 'error') {
          logger.debug('[WinAppLauncher.waitForCompletion] single-shot error');
          return false;
        }
      }

      // --- 従来型（継続監視）
      if (status.status === 'success') {
        logger.debug('[WinAppLauncher.waitForCompletion] success');
        return true;
      }
      if (status.status === 'error') {
        logger.debug('[WinAppLauncher.waitForCompletion] error');
        return false;
      }

      await this.delay(this.POLL_INTERVAL_MS);
    }

    logger.warn('[WinAppLauncher.waitForCompletion] タイムアウト');
    return false;
  }

  /**
   * status.json の更新確認
   */
  private async isStatusFileUpdated(baseline: Date): Promise<boolean> {
    const stat = await this.vault.adapter.stat(this.STATUS_FILE);
    return !!stat?.mtime && stat.mtime > baseline.getTime();
  }

  /**
   * URI で WinUI アプリを起動
   */
  private async openUri(uri: string): Promise<boolean> {
    logger.debug(`[WinAppLauncher.openUri] uri=${uri}`);
    if (!shell || typeof shell.openExternal !== 'function') {
      logger.warn('[WinAppLauncher.openUri] Electron shell unavailable');
      return false;
    }
    try {
      await shell.openExternal(uri);
      logger.debug('[WinAppLauncher.openUri] done');
      return true;
    } catch (err) {
      logger.error('[WinAppLauncher.openUri] failed', err);
      return false;
    }
  }

  /**
   * status.json を読み取り
   */
  private async readStatus(): Promise<StatusFile | null> {
    try {
      const content = await this.vault.adapter.read(this.STATUS_FILE);
      const parsed = JSON.parse(content);
      logger.debug('[WinAppLauncher.readStatus] read ok');
      return parsed;
    } catch (err) {
      logger.warn('[WinAppLauncher.readStatus] read failed', err);
      return null;
    }
  }

  /**
   * status.json の timestamp が基準より新しいか判定
   */
  private isNewer(status: StatusFile, baseline: Date): boolean {
    return !!status.timestamp && new Date(status.timestamp) > baseline;
  }

  /**
   * 指定ミリ秒待機
   */
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
