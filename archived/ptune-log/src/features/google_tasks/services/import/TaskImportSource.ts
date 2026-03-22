// File: src/features/google_tasks/services/import/TaskImportSource.ts
import { MyTask } from 'src/core/models/tasks/MyTask';

export interface TaskImportSource {
  loadTasks(): Promise<MyTask[]>;
}
