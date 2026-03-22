// src/domain/planning/TaskListRenderResult.ts

import { TaskKeys } from "../task/TaskKeys";

export interface TaskListRenderResult {
  taskListMarkdown: string;
  taskKeys: TaskKeys;
}
