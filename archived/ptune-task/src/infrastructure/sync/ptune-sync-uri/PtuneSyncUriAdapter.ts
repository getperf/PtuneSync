import {
  DiffData,
  DiffResult,
} from "../../../application/sync/shared/dto/DiffResult";
import { PullQuery } from "../../../application/sync/shared/dto/PullQuery";
import { PushQuery } from "../../../application/sync/shared/dto/PushQuery";
import { ReviewQuery } from "../../../application/sync/shared/dto/ReviewQuery";
import { getDefaultTaskListId } from "../../../application/sync/shared/DefaultTaskListId";
import { PtuneSyncPort } from "../../../application/sync/shared/ports/PtuneSyncPort";
import { PtuneSyncUriClient } from "./PtuneSyncUriClient";

type ExportLikeResult = {
  schema_version: number;
  list: string;
  exported_at: string;
  tasks: unknown[];
};

export class PtuneSyncUriAdapter implements PtuneSyncPort {
  constructor(private readonly client: PtuneSyncUriClient) {}

  async pull(query: PullQuery): Promise<string> {
    const envelope = await this.client.pull<ExportLikeResult>(query);

    if (!envelope.data) {
      throw new Error("Missing pull data");
    }

    return JSON.stringify(envelope.data);
  }

  async review(query: ReviewQuery): Promise<string> {
    const envelope = await this.client.review<ExportLikeResult>(query);

    if (!envelope.data) {
      throw new Error("Missing review data");
    }

    return JSON.stringify(envelope.data);
  }

  async diff(payload: string): Promise<DiffResult> {
    const envelope = await this.client.diff<DiffData>(payload, {
      list: getDefaultTaskListId(),
    });

    const summary = envelope.data?.summary ?? {
      create: 0,
      update: 0,
      delete: 0,
      errors: 0,
      warnings: 0,
    };

    return new DiffResult(
      envelope.success ?? envelope.status === "success",
      summary,
      envelope.data?.errors ?? [],
      envelope.data?.warnings ?? [],
      envelope.error?.message,
    );
  }

  async push(payload: string, query: PushQuery): Promise<void> {
    const envelope = await this.client.push<{ accepted: number }>(payload, query);

    if (envelope.status !== "success" || envelope.success === false) {
      throw new Error(envelope.error?.message ?? "ptune-sync push failed");
    }
  }
}
