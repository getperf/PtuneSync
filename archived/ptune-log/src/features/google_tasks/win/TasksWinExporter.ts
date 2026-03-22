import { App, Notice, TFile, normalizePath } from 'obsidian';
import { WinAppUriBuilder } from './WinAppUriBuilder';
import { WinAppLauncher, LauncherProgress } from './WinAppLauncher';
import { DailyNoteConfig } from 'src/core/utils/daily_note/DailyNoteConfig';
import { logger } from 'src/core/services/logger/loggerInstance';
import { FileUtils } from 'src/core/utils/common/FileUtils';

/**
 * WinUIアプリ経由でGoogle Tasksへエクスポートする処理
 */
export class TasksWinExporter {
  private readonly fileName = 'tasks.md';

  constructor(private app: App) { }

  /** 動的 work ディレクトリ */
  private getWorkDir(): string {
    const configDir = this.app.vault.configDir; // 例: ".obsidian"
    return normalizePath(`${configDir}/plugins/ptune-log/work`);
  }

  /**
   * 今日のデイリーノートからタスクを抽出し、WinUIアプリへ渡す
   */
  async exportFromDaily(
    onProgress?: (p: LauncherProgress) => void
  ): Promise<boolean> {
    logger.debug('[TasksWinExporter.exportFromDaily] start');
    const dailyNote = await this.getTodayNoteFile();
    if (!dailyNote) {
      new Notice('今日のデイリーノートが見つかりません');
      logger.warn('[TasksWinExporter] no daily note found');
      return false;
    }

    const lines = await FileUtils.readSection(
      this.app,
      dailyNote,
      '今日の予定タスク'
    );
    if (lines.length === 0) {
      new Notice('エクスポート対象タスクが見つかりません');
      logger.warn('[TasksWinExporter] no tasks found in section');
      return false;
    }

    const filePath = normalizePath(`${this.getWorkDir()}/${this.fileName}`);
    const content = [
      '# 今日の予定タスク',
      ...lines,
      '',
      '---',
      `# Exported at ${new Date().toLocaleString()}`,
    ].join('\n');

    try {
      logger.info(`[TasksWinExporter] writing to ${filePath}`);
      await this.app.vault.adapter.write(filePath, content);

      const uri = WinAppUriBuilder.buildExport(this.app, this.fileName);
      const launcher = new WinAppLauncher(this.app.vault);
      const ok = await launcher.launchAndWait(uri, 'export', onProgress);

      new Notice(
        ok
          ? 'WinUIアプリによるエクスポートが完了しました'
          : 'エクスポート処理に失敗しました'
      );
      logger.info(`[TasksWinExporter] completed=${ok}`);
      return ok;
    } catch (err) {
      logger.error('[TasksWinExporter] export failed', err);
      new Notice(`エクスポート中にエラーが発生しました: ${String(err)}`);
      return false;
    }
  }

  /**
   * 今日のデイリーノートを取得
   */
  private async getTodayNoteFile(): Promise<TFile | null> {
    const path = await DailyNoteConfig.getDailyNotePath(this.app.vault);
    if (!path) return null;
    const file = this.app.vault.getAbstractFileByPath(path);
    return file instanceof TFile ? file : null;
  }
}
