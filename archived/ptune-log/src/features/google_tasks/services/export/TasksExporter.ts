import { GoogleTasksAPI } from 'src/features/google_tasks/utils/GoogleTasksAPI';
import { TasksExportModal } from './TasksExportModal';
import { logger } from 'src/core/services/logger/loggerInstance';
import { MyTask } from 'src/core/models/tasks/MyTask';
import { PomodoroInfo } from 'src/core/models/tasks/MyTask/PomodoroInfo';
import { DateUtil } from 'src/core/utils/date/DateUtil';
import { MarkdownTaskEntry } from 'src/core/models/tasks/MarkdownTaskEntry';
import { createAndLogError } from 'src/core/utils/errors/errorFactory';

/**
 * ParsedTask配列をGoogle Tasksへ登録し、登録済みMyTask配列を返す
 */
export class TasksExporter {
  constructor(
    private api: GoogleTasksAPI,
    private tasklistTitle: string = 'Today'
  ) {}

  /**
   * 親→子順で登録し、MyTask[] を返す
   */
  async export(
    parsed: MarkdownTaskEntry[],
    modal?: TasksExportModal
  ): Promise<MyTask[]> {
    logger.info(`[TasksExporter.export] start list=${this.tasklistTitle}`);

    const tasklistId = await this.api.findTaskListId(this.tasklistTitle);
    if (!tasklistId)
      throw createAndLogError(
        `${this.tasklistTitle} タスクリストが見つかりません`
      );

    const existing = await this.api.listTasks(tasklistId);
    if (existing.length > 0)
      throw createAndLogError(`既存のタスクが存在します。リセットしてください`);

    const parents = parsed
      .filter((t) => t.parent_index === undefined)
      .reverse();
    const children = parsed
      .filter((t) => t.parent_index !== undefined)
      .reverse();
    const indexToId = new Map<number, string>();
    const exportedTasks: MyTask[] = [];

    for (const task of parents) {
      const myTask = this.toMyTask(task);
      const created = await this.api.addTask(myTask, tasklistId);

      if (!created.id) {
        throw createAndLogError(
          `タスクIDが取得できませんでした: ${task.title}`
        );
      }

      myTask.id = created.id;
      exportedTasks.push(myTask);
      indexToId.set(task.index, created.id);
    }

    for (const task of children) {
      const myTask = this.toMyTask(task);
      const created = await this.api.addTask(myTask, tasklistId);

      if (!created.id) {
        throw createAndLogError(
          `子タスクIDが取得できませんでした: ${task.title}`
        );
      }

      const parentIndex = task.parent_index;
      const parentId =
        parentIndex !== undefined ? indexToId.get(parentIndex) : undefined;

      if (parentId) {
        await this.api.moveTask(created.id, tasklistId, parentId);
        myTask.parent = parentId;
      }

      myTask.id = created.id;
      exportedTasks.push(myTask);
    }

    logger.debug(`[TasksExporter.export] done: ${exportedTasks.length} tasks`);
    return exportedTasks;
  }

  private toMyTask(parsed: MarkdownTaskEntry): MyTask {
    return new MyTask(
      '',
      parsed.title,
      undefined,
      `from: ${this.tasklistTitle}`,
      undefined,
      undefined,
      parsed.pomodoro > 0 ? new PomodoroInfo(parsed.pomodoro) : undefined,
      'needsAction',
      undefined,
      undefined,
      undefined,
      DateUtil.utcString(),
      undefined,
      false
    );
  }
}
