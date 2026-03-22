// File: src/features/google_tasks/services/time_analysis/models/TaskExecutionEntry.ts

import { MyTask } from 'src/core/models/tasks/MyTask';
import { RelatedNote } from './RelatedNote';
import { ReviewFlag } from 'src/core/models/tasks/MyTask/ReviewFlag';
import { logger } from 'src/core/services/logger/loggerInstance';

export interface PomodoroSum {
  planned: number;
  actual: number;
}

export class TaskExecutionEntry {
  relatedNotes?: RelatedNote[];

  constructor(
    public readonly taskKey: string,
    public readonly id: string,
    public readonly title: string,
    public readonly status: 'completed' | 'needsAction',
    public readonly parentTaskKey?: string,
    public readonly pomodoro?: {
      planned?: number;
      actual?: number;
      delta?: number;
    },
    public readonly started?: string,
    public readonly completed?: string,
    public readonly reviewFlags?: Set<ReviewFlag>,
  ) {}

  /**
   * 集計結果から最終出力用 Entry を生成
   * - actual=0 は出力しない
   * - planned=0 は出力しない
   * - delta は actual>0 の場合のみ
   */
  static fromAggregated(args: {
    taskKey: string;
    parentTaskKey?: string;
    task: MyTask;
    sum: PomodoroSum;
  }): TaskExecutionEntry {
    const { taskKey, parentTaskKey, task, sum } = args;

    const hasPlanned = sum.planned > 0;
    const hasActual = sum.actual > 0;

    let pomodoro:
      | {
          planned?: number;
          actual?: number;
          delta?: number;
        }
      | undefined;

    if (hasPlanned || hasActual) {
      pomodoro = {};
      if (hasPlanned) pomodoro.planned = sum.planned;
      if (hasActual) {
        pomodoro.actual = sum.actual;
        pomodoro.delta = sum.actual - sum.planned;
      }
    }

    return new TaskExecutionEntry(
      taskKey,
      task.id,
      task.title,
      task.status ?? 'needsAction',
      parentTaskKey,
      pomodoro,
      task.started,
      task.completed,
      task.reviewFlags && task.reviewFlags.size > 0
        ? new Set(task.reviewFlags)
        : undefined,
    );
  }
}
