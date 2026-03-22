// src/task-io/transforms/json/MigrationRunner.ts

import { CURRENT_SCHEMA_VERSION, CurrentSchemaVersion } from "./schema";
import { migrateV0ToV1 } from "./migrations/v0ToV1";
import { RawPayload, RawPayloadV1 } from "../json/JsonToEntries";

/**
 * JSON入力を最新スキーマへマイグレーションする責務
 * - 片方向（古い→新しい）のみ
 * - ここでは「構造」変換だけを担当（ドメイン変換はしない）
 */
export class MigrationRunner {
  static toLatest(input: RawPayload): RawPayloadV1 {
    const version = this.detectVersion(input);

    if (version === CURRENT_SCHEMA_VERSION) {
      // ここに来るなら必ず v1 形状（型ガード）
      const v1 = input as RawPayloadV1;
      return v1;
    }

    if (version === 0) {
      return migrateV0ToV1(input);
    }

    throw new Error(`Unsupported schema_version: ${version}`);
  }

  static detectVersion(input: RawPayload): number {
    if (!input) return 0;

    if (Array.isArray(input)) return 0;

    if (typeof input === "object") {
      const anyObj = input as unknown as Record<string, unknown>;
      const v = anyObj["schema_version"];
      if (typeof v === "number" && Number.isFinite(v)) return v;
      return 0;
    }

    return 0;
  }

  static assertCurrentVersion(v: number): asserts v is CurrentSchemaVersion {
    if (v !== CURRENT_SCHEMA_VERSION) {
      throw new Error(
        `schema_version mismatch: expected ${CURRENT_SCHEMA_VERSION}, got ${v}`,
      );
    }
  }
}
