// File: src/features/google_tasks/services/import/ApiTaskImportSource.ts

import { GoogleTasksAPI } from '../../utils/GoogleTasksAPI';
import { MyTaskFactory } from 'src/core/models/tasks/MyTaskFactory';
import { TaskImportSource } from './TaskImportSource';
import { MyTask } from 'src/core/models/tasks/MyTask';

export class ApiTaskImportSource implements TaskImportSource {
  constructor(private readonly api: GoogleTasksAPI) {}

  async loadTasks(): Promise<MyTask[]> {
    const listId = await this.api.findTaskListId('Today');
    if (!listId) return [];

    const raw = await this.api.listTasks(listId);
    return raw.map((t) => MyTaskFactory.fromGoogleTask(t, listId));
  }
}
