import { PullQuery } from "../../../application/sync/shared/dto/PullQuery";
import { PushQuery } from "../../../application/sync/shared/dto/PushQuery";
import { ReviewQuery } from "../../../application/sync/shared/dto/ReviewQuery";
import { PtuneSyncStatusEnvelope } from "./PtuneSyncStatusEnvelope";
import { PtuneSyncUriBuilder } from "./PtuneSyncUriBuilder";
import { PtuneSyncUriLauncher } from "./PtuneSyncUriLauncher";
import { PtuneSyncStatusWatcher } from "./PtuneSyncStatusWatcher";
import { PtuneSyncInputFileWriter } from "./PtuneSyncInputFileWriter";
import { PtuneSyncWorkDir } from "./PtuneSyncWorkDir";

export class PtuneSyncUriClient {
  private inFlight = false;

  constructor(
    private readonly workDir: PtuneSyncWorkDir,
    private readonly builder: PtuneSyncUriBuilder,
    private readonly launcher: PtuneSyncUriLauncher,
    private readonly watcher: PtuneSyncStatusWatcher,
    private readonly inputWriter: PtuneSyncInputFileWriter,
  ) {}

  authStatus<TData>(): Promise<PtuneSyncStatusEnvelope<TData>> {
    return this.run(this.builder.buildAuthStatus());
  }

  authLogin<TData>(): Promise<PtuneSyncStatusEnvelope<TData>> {
    return this.run(this.builder.buildAuthLogin());
  }

  pull<TData>(query: PullQuery): Promise<PtuneSyncStatusEnvelope<TData>> {
    return this.run(
      this.builder.buildPull(query.list, !!query.includeCompleted),
    );
  }

  review<TData>(query: ReviewQuery): Promise<PtuneSyncStatusEnvelope<TData>> {
    return this.run(this.builder.buildReview(query.list));
  }

  async diff<TData>(
    payload: string,
    query: PushQuery,
  ): Promise<PtuneSyncStatusEnvelope<TData>> {
    await this.workDir.ensureExists();
    const inputPath = await this.inputWriter.writeDiffInput(payload);

    return this.run(this.builder.buildDiff(inputPath, query.list));
  }

  async push<TData>(
    payload: string,
    query: PushQuery,
  ): Promise<PtuneSyncStatusEnvelope<TData>> {
    await this.workDir.ensureExists();
    const inputPath = await this.inputWriter.writePushInput(payload);

    return this.run(
      this.builder.buildPush(inputPath, query.list, !!query.allowDelete),
    );
  }

  private async run<TData>(
    uri: string,
  ): Promise<PtuneSyncStatusEnvelope<TData>> {
    if (this.inFlight) {
      throw new Error("ptune-sync command is already running");
    }

    this.inFlight = true;

    try {
      await this.workDir.ensureExists();
      const baseline = new Date();
      await this.launcher.launch(uri);
      return await this.watcher.waitForCompletion<TData>(baseline);
    } finally {
      this.inFlight = false;
    }
  }
}
