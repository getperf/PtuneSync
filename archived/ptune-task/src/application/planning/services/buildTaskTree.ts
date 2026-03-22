// src/application/planning/services/buildTaskTree.ts

import { TaskEntry } from "../../../domain/task/TaskEntry";
import { TaskTreeBuilder } from "../../../infrastructure/conversion/task";
import type { TaskTreeNode } from "../../../infrastructure/conversion/task/tree/TaskTreeBuilder";

/**
 * entries -> tree の薄いラッパ。
 * （TaskTreeBuilderの責務は維持しつつ、呼び出し点を統一）
 */
export function buildTaskTree(entries: TaskEntry[]): TaskTreeNode[] {
  return TaskTreeBuilder.build(entries);
}
