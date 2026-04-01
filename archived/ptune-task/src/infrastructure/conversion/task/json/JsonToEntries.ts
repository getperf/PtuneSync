// src/task-io/transforms/json/JsonToEntries.ts

import { TaskEntry } from "../../../../domain/task/TaskEntry";
import { MigrationRunner } from "../schema/MigrationRunner";


/* =========
 * Raw types
 * ========= */

export interface RawTask {
  id: string;
  title: string;
  parent: string | null;
  pomodoro_planned: number | null;
  tags?: string[];
  goal?: string | null;
}

/** v0: schema_version なし（現行の想定） */
export interface RawPayloadV0 {
  tasks: RawTask[];
}

/** v1: schema_version あり */
export interface RawPayloadV1 {
  schema_version: number; // CURRENT_SCHEMA_VERSION を想定（検証は MigrationRunner 側）
  tasks: RawTask[];
}

/**
 * 入力は以下を許容：
 * - v1: { schema_version, tasks }
 * - v0: { tasks }
 * - legacy: RawTask[]（配列直）
 */
export type RawPayload = RawPayloadV1 | RawPayloadV0 | RawTask[];

export class JsonToEntries {
  /**
   * JSON入力（Raw）を TaskEntry[] に変換する
   * - schema_version の差異は MigrationRunner で吸収
   */
  static convert(input: RawPayload): TaskEntry[] {
    const payload = MigrationRunner.toLatest(input);

    // ここで tasks 要素の最小バリデーション（必要なら強化）
    if (!Array.isArray(payload.tasks)) {
      throw new Error("Invalid payload: tasks must be an array.");
    }

    return payload.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      parentId: t.parent ?? null,
      parentKey: null,
      pomodoroPlanned: t.pomodoro_planned ?? null,
      tags: t.tags ?? [],
      goal: t.goal ?? null,
    }));
  }
}
