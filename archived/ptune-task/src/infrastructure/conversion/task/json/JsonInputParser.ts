// src/task-io/transforms/json/JsonInputParser.ts

import { RawPayload } from "./JsonToEntries";

/**
 * JSON文字列を安全にパースする責務のみを持つクラス
 * - JSON.parse の例外を明示的なエラーへ変換
 * - 将来のスキーマ検証追加ポイント
 *
 * NOTE:
 * - schema_version の解釈やマイグレーションはここでは行わない（責務分離）
 */
export class JsonInputParser {
  static parse(raw: string): RawPayload {
    if (!raw || raw.trim().length === 0) {
      throw new Error("Input JSON is empty.");
    }

    try {
      const parsed = JSON.parse(raw) as unknown;

      // ここでは「形状の最小チェック」までに留める（詳細は後段へ）
      if (parsed === null || parsed === undefined) {
        throw new Error("Parsed JSON is null/undefined.");
      }

      return parsed as RawPayload;
    } catch (err) {
      throw new Error(`Invalid JSON format: ${(err as Error).message}`);
    }
  }
}
