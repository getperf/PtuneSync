// src/task-io/transforms/json/migrations/v0ToV1.ts

import { RawPayload, RawPayloadV0, RawPayloadV1, RawTask } from "../../json/JsonToEntries";
import { CURRENT_SCHEMA_VERSION } from "../schema";

/**
 * v0 → v1 変換
 * v0 は以下を許容：
 * - { tasks: RawTask[] }（schema_versionなし）
 * - RawTask[]（配列直）
 */
export function migrateV0ToV1(input: RawPayload): RawPayloadV1 {
  const tasks = extractTasks(input);

  return {
    schema_version: CURRENT_SCHEMA_VERSION,
    tasks,
  };
}

function extractTasks(input: RawPayload): RawTask[] {
  if (Array.isArray(input)) {
    return input as RawTask[];
  }

  const obj = input as RawPayloadV0;
  if (!obj || typeof obj !== "object") {
    throw new Error("Invalid v0 payload: not an object/array.");
  }

  if (!Array.isArray(obj.tasks)) {
    throw new Error("Invalid v0 payload: tasks must be an array.");
  }

  return obj.tasks;
}
