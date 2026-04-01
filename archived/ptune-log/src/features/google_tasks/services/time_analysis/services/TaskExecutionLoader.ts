// File: src/features/google_tasks/services/time_analysis/services/TaskExecutionLoader.ts

import { App } from 'obsidian';
import { TaskJsonUtils } from 'src/core/utils/task/TaskJsonUtils';
import { MyTask } from 'src/core/models/tasks/MyTask';
import { logger } from 'src/core/services/logger/loggerInstance';

export class TaskExecutionLoader {
  private readonly json: TaskJsonUtils;

  constructor(app: App) {
    this.json = new TaskJsonUtils(app);
  }

  async load(date: Date): Promise<MyTask[]> {
    const tasks = await this.json.load(date);

    logger.info(
      `[TaskExecutionLoader] loaded=${tasks.length}, ` +
      `completed=${tasks.filter(t => t.status === 'completed').length}`
    );

    return tasks;
  }
}
