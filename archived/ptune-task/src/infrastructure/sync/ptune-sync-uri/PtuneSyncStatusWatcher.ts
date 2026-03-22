import { App } from "obsidian";
import { PtuneSyncStatusEnvelope } from "./PtuneSyncStatusEnvelope";
import { PtuneSyncWorkDir } from "./PtuneSyncWorkDir";
import { PtuneSyncStatusParser } from "./PtuneSyncStatusParser";

export class PtuneSyncStatusWatcher {
  private readonly pollIntervalMs = 500;
  private readonly timeoutMs = 90000;

  constructor(
    private readonly app: App,
    private readonly workDir: PtuneSyncWorkDir,
  ) {}

  async waitForCompletion<TData>(
    baseline: Date,
  ): Promise<PtuneSyncStatusEnvelope<TData>> {
    const timeoutAt = Date.now() + this.timeoutMs;

    while (Date.now() < timeoutAt) {
      const envelope = await this.tryRead<TData>();

      if (!envelope || !this.isNewer(envelope, baseline)) {
        await this.delay(this.pollIntervalMs);
        continue;
      }

      if (envelope.status === "running") {
        await this.delay(this.pollIntervalMs);
        continue;
      }

      return envelope;
    }

    throw new Error("ptune-sync status wait timed out");
  }

  private async tryRead<TData>(): Promise<PtuneSyncStatusEnvelope<TData> | null> {
    const path = this.workDir.getStatusFile();

    if (!(await this.app.vault.adapter.exists(path))) {
      return null;
    }

    try {
      const raw = await this.app.vault.adapter.read(path);
      return PtuneSyncStatusParser.parse<TData>(raw);
    } catch {
      return null;
    }
  }

  private isNewer(envelope: PtuneSyncStatusEnvelope, baseline: Date): boolean {
    const timestamp = Date.parse(envelope.timestamp);

    return !Number.isNaN(timestamp) && timestamp > baseline.getTime();
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }
}
