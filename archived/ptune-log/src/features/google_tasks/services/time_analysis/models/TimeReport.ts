// File: src/features/google_tasks/services/time_analysis/models/TimeReport.ts

import { TaskExecutionEntry } from './TaskExecutionEntry';

export class TimeReport {
  constructor(
    public readonly date: string, // YYYY-MM-DD
    public readonly source: 'task_execution',
    public readonly tasks: Map<string, TaskExecutionEntry>
  ) {}
}
