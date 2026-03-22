import { App } from "obsidian";
import { PtuneSyncPort } from "../../application/sync/shared/ports/PtuneSyncPort";
import { PullAndMergeTodayUseCase } from "../../application/sync/pull/PullAndMergeTodayUseCase";
import { PushSyncUseCase } from "../../application/sync/push/PushSyncUseCase";
import { ApplyPushUseCase } from "../../application/sync/push/ApplyPushUseCase";
import { DiffDailyNoteUseCase } from "../../application/sync/diff/DiffDailyNoteUseCase";
import { MergeTaskTreeService } from "../../application/sync/merge/MergeTaskTreeService";
import { SyncAndRebuildDailyNoteUseCase } from "../../application/rebuild/SyncAndRebuildDailyNoteUseCase";
import { ObsidianConfirmDialog } from "../../infrastructure/obsidian/ObsidianConfirmDialog";
import { CalendarFactory } from "./CalendarFactory";
import { PtuneRuntime } from "../../shared/PtuneRuntime";
import { PtuneSyncWorkDir } from "../../infrastructure/sync/ptune-sync-uri/PtuneSyncWorkDir";
import { PtuneSyncUriBuilder } from "../../infrastructure/sync/ptune-sync-uri/PtuneSyncUriBuilder";
import { PtuneSyncUriLauncher } from "../../infrastructure/sync/ptune-sync-uri/PtuneSyncUriLauncher";
import { PtuneSyncStatusWatcher } from "../../infrastructure/sync/ptune-sync-uri/PtuneSyncStatusWatcher";
import { PtuneSyncInputFileWriter } from "../../infrastructure/sync/ptune-sync-uri/PtuneSyncInputFileWriter";
import { PtuneSyncUriClient } from "../../infrastructure/sync/ptune-sync-uri/PtuneSyncUriClient";
import { PtuneSyncUriAdapter } from "../../infrastructure/sync/ptune-sync-uri/PtuneSyncUriAdapter";
import { PtuneSyncUriAuthService } from "../../infrastructure/sync/ptune-sync-uri/PtuneSyncUriAuthService";

export class SyncFactory {
  private readonly workDir: PtuneSyncWorkDir;
  private readonly client: PtuneSyncUriClient;

  constructor(
    private readonly app: App,
    private readonly runtime: PtuneRuntime,
    private readonly calendarFactory: CalendarFactory,
    private readonly confirmDialog: ObsidianConfirmDialog,
  ) {
    this.workDir = new PtuneSyncWorkDir(app);
    this.client = new PtuneSyncUriClient(
      this.workDir,
      new PtuneSyncUriBuilder(this.workDir),
      new PtuneSyncUriLauncher(),
      new PtuneSyncStatusWatcher(app, this.workDir),
      new PtuneSyncInputFileWriter(app, this.workDir),
    );
  }

  createClient(): PtuneSyncUriClient {
    return this.client;
  }

  createSyncPort(): PtuneSyncPort {
    return new PtuneSyncUriAdapter(this.client);
  }

  createAuthService(): PtuneSyncUriAuthService {
    return new PtuneSyncUriAuthService(this.client);
  }

  createPullAndMergeTodayUseCase(): PullAndMergeTodayUseCase {
    return new PullAndMergeTodayUseCase(
      this.createSyncPort(),
      this.calendarFactory.createTodayResolver(),
      this.runtime.dailyNoteRepository,
      this.calendarFactory.createCreateDailyNoteUseCase(),
      this.runtime,
      new MergeTaskTreeService(),
    );
  }

  createSyncDailyNoteUseCase(): PushSyncUseCase {
    const diffUseCase = new DiffDailyNoteUseCase(
      this.runtime.dailyNoteRepository,
      this.createSyncPort(),
    );
    const pushUseCase = new ApplyPushUseCase(this.createSyncPort());

    return new PushSyncUseCase(
      diffUseCase,
      pushUseCase,
      this.confirmDialog,
    );
  }

  createRebuildDailyNoteUseCase(): SyncAndRebuildDailyNoteUseCase {
    return new SyncAndRebuildDailyNoteUseCase(
      this.createSyncPort(),
      this.calendarFactory.createTodayResolver(),
      this.runtime.dailyNoteRepository,
      this.runtime,
    );
  }
}
