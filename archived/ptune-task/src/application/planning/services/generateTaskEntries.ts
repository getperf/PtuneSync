// src/application/planning/services/generateTaskEntries.ts

import {
  JsonToEntries,
  type RawPayload,
} from "../../../infrastructure/conversion/task/json/JsonToEntries";

/**
 * Google Pull payload を TaskEntry[] に変換する責務を分離。
 */
export function generateTaskEntries(payload: RawPayload) {
  return JsonToEntries.convert(payload);
}
