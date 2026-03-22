import { GoogleTasksAPI } from 'src/features/google_tasks/utils/GoogleTasksAPI';
import { logger } from 'src/core/services/logger/loggerInstance';

/**
 * Google Tasks リストの存在確認と自動作成を行う初期化クラス
 */
export class TaskListInitializer {
  constructor(private api: GoogleTasksAPI) {}

  /**
   * 指定名のリストがなければ新規作成
   */
  async ensureTaskList(name: string): Promise<string> {
    logger.info(`[TaskListInitializer.ensureTaskList] start: ${name}`);
    const listId = await this.api.findTaskListId(name);
    if (listId) {
      logger.debug(`[TaskListInitializer.ensureTaskList] exists: ${name}`);
      return listId;
    }

    logger.info(`[TaskListInitializer.ensureTaskList] create: ${name}`);
    const newList = await this.api.createTaskList(name);
    logger.debug(`[TaskListInitializer.ensureTaskList] done: ${newList.id}`);
    return newList.id;
  }
}
