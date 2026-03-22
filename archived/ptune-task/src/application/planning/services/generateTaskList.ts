// src/application/planning/services/generateTaskList.ts

import { TaskListRenderResult } from "../../../domain/planning/TaskListRenderResult";
import type { RawPayload } from "../../../infrastructure/conversion/task/json/JsonToEntries";
import { generateTaskEntries } from "./generateTaskEntries";
import { buildTaskTree } from "./buildTaskTree";
import { renderTaskTree } from "./renderTaskTree";

/**
 * 互換維持ラッパ（従来のAPIは維持）
 * payload -> entries -> tree -> markdown + taskKeys
 */
export function generateTaskList(payload: RawPayload): TaskListRenderResult {
  const entries = generateTaskEntries(payload);
  const tree = buildTaskTree(entries);
  return renderTaskTree(tree);
}
