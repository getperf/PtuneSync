import { App, Notice } from 'obsidian';
import { WinAppUriBuilder } from './WinAppUriBuilder';
import { WinAppLauncher } from './WinAppLauncher';
import { DailyNoteConfig } from 'src/core/utils/daily_note/DailyNoteConfig';
import { logger } from 'src/core/services/logger/loggerInstance';
import { ErrorUtils } from 'src/core/utils/common/ErrorUtils';
import { DailyNoteTaskUpdater } from 'src/core/services/daily_notes/task_keys/DailyNoteTaskUpdater';

const DAILY_TASK_HEADING = '## ✅ 今日の予定タスク（手動で追記OK）';

export class GetTasksMarkdownExecutor {
  constructor(private readonly app: App) { }

  async execute(): Promise<void> {
    logger.info('[GetTasksMarkdownExecutor] start');

    try {
      new Notice('WinUI アプリを起動しています...');
      const uri = WinAppUriBuilder.buildGetTasksMd(this.app);
      const launcher = new WinAppLauncher(this.app.vault);

      const status = await launcher.launchWaitAndGetStatus(uri, 'get-tasks-md');
      if (!status) {
        new Notice('⚠ tasks.md の取得に失敗しました（未完了）');
        return;
      }

      const markdown = (status.message ?? '').trim();
      logger.debug(
        `[GetTasksMarkdownExecutor] status.operation=${status.operation} status=${status.status} messageLen=${markdown.length}`
      );

      if (!markdown) {
        new Notice('⚠ 取得結果が空です');
        return;
      }

      const notePath = await DailyNoteConfig.getDailyNotePath(this.app.vault);
      if (!notePath) {
        new Notice('今日のデイリーノートが見つかりません');
        return;
      }

      const updater = new DailyNoteTaskUpdater(this.app);
      await updater.replaceTaskListInSection(
        notePath,
        DAILY_TASK_HEADING,
        markdown
      );

      new Notice('✅ 今日の予定タスクを更新しました');
      logger.info('[GetTasksMarkdownExecutor] completed');
    } catch (err) {
      const msg = ErrorUtils.toMessage(err);
      logger.error('[GetTasksMarkdownExecutor] failed', err);
      new Notice(`❌ タスク取得に失敗しました: ${msg}`);
    }
  }
}
