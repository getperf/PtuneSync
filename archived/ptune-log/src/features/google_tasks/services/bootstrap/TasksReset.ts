import { GoogleTasksAPI } from 'src/features/google_tasks/utils/GoogleTasksAPI';
import { TaskListInitializer } from './TaskListInitializer';
import { logger } from 'src/core/services/logger/loggerInstance';

/**
 * Google Tasksリストの既存タスクを削除する初期化処理クラス
 */
export class TasksReset {
  private listId: string | null = null;
  private tasks: { id: string; title: string }[] = [];
  private initialized = false;

  constructor(private api: GoogleTasksAPI, private taskListName: string) {}

  /**
   * listId とタスク一覧を取得（初回のみ）
   */
  private async ensure(): Promise<boolean> {
    logger.debug('[TasksReset.ensure] start');
    if (this.initialized) return true;

    const initializer = new TaskListInitializer(this.api);
    this.listId = await initializer.ensureTaskList(this.taskListName);
    if (!this.listId) {
      logger.error(
        `[TasksReset.ensure] タスクリスト "${this.taskListName}" の初期化に失敗`
      );
      return false;
    }

    this.tasks = await this.api.listTasks(this.listId);
    this.initialized = true;
    logger.info(`[TasksReset.ensure] ${this.tasks.length} tasks loaded`);
    return true;
  }

  /**
   * 既存タスクがあるかを返す
   */
  async hasExistingTasks(): Promise<boolean> {
    const ok = await this.ensure();
    const has = ok && this.tasks.length > 0;
    logger.debug(`[TasksReset.hasExistingTasks] result=${has}`);
    return has;
  }

  /**
   * タスクを一括削除
   */
  async run(): Promise<void> {
    logger.info('[TasksReset.run] start');
    const ok = await this.ensure();
    if (!ok || !this.listId || this.tasks.length === 0) {
      logger.debug('[TasksReset.run] no tasks to delete');
      return;
    }

    for (const task of this.tasks) {
      await this.api.deleteTask(task.id, this.listId);
      logger.debug(`[TasksReset.run] deleted: ${task.title}`);
    }

    logger.info('[TasksReset.run] completed');
  }
}
