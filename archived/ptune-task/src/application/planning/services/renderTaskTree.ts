// src/application/planning/services/renderTaskTree.ts

import { TaskListRenderResult } from "../../../domain/planning/TaskListRenderResult";
import {
  EntriesToMarkdown,
  TaskKeyBuilder,
} from "../../../infrastructure/conversion/task";
import type { TaskTreeNode } from "../../../infrastructure/conversion/task/tree/TaskTreeBuilder";

/**
 * tree -> markdown + taskKeys の責務を分離。
 */
export function renderTaskTree(tree: TaskTreeNode[]): TaskListRenderResult {
  const taskKeys = TaskKeyBuilder.build(tree);
  const taskListMarkdown = EntriesToMarkdown.renderTaskList(tree);

  return {
    taskListMarkdown,
    taskKeys,
  };
}
