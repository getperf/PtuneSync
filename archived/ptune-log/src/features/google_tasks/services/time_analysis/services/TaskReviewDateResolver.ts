// File: src/features/google_tasks/services/time_analysis/TaskReviewDateResolver.ts

import { DateUtil } from 'src/core/utils/date/DateUtil';
import { TaskJsonUtils } from 'src/core/utils/task/TaskJsonUtils';

export type TaskReviewDateMode =
  | 'today-import'
  | 'past-existing'
  | 'past-missing';

export class TaskReviewDateResolver {
  static async resolve(
    date: Date,
    saver: TaskJsonUtils,
  ): Promise<TaskReviewDateMode> {
    if (DateUtil.isToday(date)) return 'today-import';
    return (await saver.exists(date)) ? 'past-existing' : 'past-missing';
  }
}
