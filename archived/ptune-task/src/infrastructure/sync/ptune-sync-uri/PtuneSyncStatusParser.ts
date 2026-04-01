import { PtuneSyncStatusEnvelope } from "./PtuneSyncStatusEnvelope";

export class PtuneSyncStatusParser {
  static parse<TData>(raw: string): PtuneSyncStatusEnvelope<TData> {
    const parsed: unknown = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      throw new Error("Invalid ptune-sync status: expected object");
    }

    const envelope = parsed as PtuneSyncStatusEnvelope<TData>;

    if (typeof envelope.version !== "number") {
      throw new Error("Invalid ptune-sync status: missing version");
    }

    if (typeof envelope.timestamp !== "string") {
      throw new Error("Invalid ptune-sync status: missing timestamp");
    }

    if (
      envelope.status !== "running"
      && envelope.status !== "success"
      && envelope.status !== "error"
    ) {
      throw new Error("Invalid ptune-sync status: invalid status");
    }

    return envelope;
  }
}
