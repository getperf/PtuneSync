import { App } from "obsidian";
import { GenerateDailyReviewFlowUseCase } from "../application/review_flow/usecases/GenerateDailyReviewFlowUseCase";
import { GenerateDailyReviewUseCase } from "../application/review/usecases/GenerateDailyReviewUseCase";
import { GenerateDailyNotesReviewUseCase } from "../application/daily_notes_review/usecases/GenerateDailyNotesReviewUseCase";
import { DailyNotesReportBuilder } from "../application/daily_notes_review/builders/DailyNotesReportBuilder";
import { CollectCreatedNotesUseCase } from "../application/note_scan/usecases/CollectCreatedNotesUseCase";
import { NoteSummaryGenerator } from "../application/note_review/services/NoteSummaryGenerator";
import { ReviewFlowOptionsResolver } from "../application/review_flow/services/ReviewFlowOptionsResolver";
import { ObsidianContext } from "../infrastructure/obsidian/ObsidianContext";
import { PullTodayCommand } from "../presentation/pull/PullTodayCommand";
import { PushAndRebuildCommand } from "../presentation/push/PushAndRebuildCommand";
import { ReviewCommand } from "../presentation/review/ReviewCommand";
import { NoteCreationFeature } from "../presentation/note/NoteCreationFeature";
import { PtuneRuntime } from "../shared/PtuneRuntime";
import { CalendarFactory } from "./factories/CalendarFactory";
import { HookFactory } from "./factories/HookFactory";
import { NoteFactory } from "./factories/NoteFactory";
import { PresentationFactory } from "./factories/PresentationFactory";
import { ReviewFeatureFactory } from "./factories/ReviewFeatureFactory";
import { SyncFactory } from "./factories/SyncFactory";
import { DailyNoteOpenHook } from "../infrastructure/obsidian/DailyNoteOpenHook";
import { LayoutReadyHook } from "../infrastructure/obsidian/LayoutReadyHook";
import { PtuneSyncUriAuthService } from "../infrastructure/sync/ptune-sync-uri/PtuneSyncUriAuthService";
import { DailyNotesReviewWriter } from "../infrastructure/document/review/DailyNotesReviewWriter";
import { LlmClient } from "../infrastructure/llm/LlmClient";
import { CreatedProjectNoteRepository } from "../infrastructure/repository/CreatedProjectNoteRepository";
import { ProjectNoteFrontmatterRepository } from "../infrastructure/repository/ProjectNoteFrontmatterRepository";
import { ReviewPointXMindTemplateService } from "../infrastructure/review/ReviewPointXMindTemplateService";

export class Container {
  private readonly runtime: PtuneRuntime;
  private readonly calendarFactory: CalendarFactory;
  private readonly noteFactory: NoteFactory;
  private readonly reviewFeatureFactory: ReviewFeatureFactory;
  private readonly presentationFactory: PresentationFactory;
  private readonly syncFactory: SyncFactory;
  private readonly hookFactory: HookFactory;

  constructor(private readonly app: App) {
    this.runtime = new PtuneRuntime(new ObsidianContext(app));
    this.calendarFactory = new CalendarFactory(app, this.runtime);
    this.noteFactory = new NoteFactory(app, this.runtime, this.calendarFactory);
    this.reviewFeatureFactory = new ReviewFeatureFactory(app);
    this.presentationFactory = new PresentationFactory(app);
    this.syncFactory = new SyncFactory(
      app,
      this.runtime,
      this.calendarFactory,
      this.presentationFactory.createConfirmDialog(),
    );
    this.hookFactory = new HookFactory(app, this.calendarFactory);
  }

  createPullTodayCommand(): PullTodayCommand {
    return new PullTodayCommand(
      this.syncFactory.createPullAndMergeTodayUseCase(),
      this.presentationFactory.createObsidianPresenter(),
    );
  }

  createSyncAndRebuildCommand(): PushAndRebuildCommand {
    return new PushAndRebuildCommand(
      this.calendarFactory.createTodayResolver(),
      this.runtime.dailyNoteRepository,
      this.syncFactory.createSyncDailyNoteUseCase(),
      this.syncFactory.createRebuildDailyNoteUseCase(),
      this.presentationFactory.createObsidianPresenter(),
    );
  }

  createReviewCommand(): ReviewCommand {
    return new ReviewCommand(
      this.calendarFactory.createTodayResolver(),
      new ReviewFlowOptionsResolver(),
      this.createGenerateDailyReviewFlowUseCase(),
      this.presentationFactory.createObsidianPresenter(),
    );
  }

  createDailyNoteOpenHook(): DailyNoteOpenHook {
    return this.hookFactory.createDailyNoteOpenHook();
  }

  createLayoutReadyHook(): LayoutReadyHook {
    return this.hookFactory.createLayoutReadyHook();
  }

  createNoteCreationFeature(): NoteCreationFeature {
    return this.noteFactory.createNoteCreationFeature();
  }

  createNoteReviewFeature() {
    return this.reviewFeatureFactory.createNoteReviewFeature();
  }

  createGenerateDailyReviewUseCase(): GenerateDailyReviewUseCase {
    return new GenerateDailyReviewUseCase(
      this.syncFactory.createSyncPort(),
      this.runtime.dailyNoteRepository,
      this.calendarFactory.createCreateDailyNoteUseCase(),
    );
  }

  createGenerateDailyNotesReviewUseCase(
    llm = new LlmClient(),
  ): GenerateDailyNotesReviewUseCase {
    const noteRepo = new ProjectNoteFrontmatterRepository(this.app);
    const createdRepo = new CreatedProjectNoteRepository(this.app);

    return new GenerateDailyNotesReviewUseCase(
      this.calendarFactory.createCreateDailyNoteUseCase(),
      this.runtime.dailyNoteRepository,
      new CollectCreatedNotesUseCase(createdRepo, noteRepo),
      createdRepo,
      noteRepo,
      new NoteSummaryGenerator(llm, noteRepo),
      llm,
      new DailyNotesReviewWriter(),
      new DailyNotesReportBuilder(),
      new ReviewPointXMindTemplateService(this.app),
    );
  }

  createGenerateDailyReviewFlowUseCase(): GenerateDailyReviewFlowUseCase {
    const llm = new LlmClient();

    return new GenerateDailyReviewFlowUseCase(
      this.createGenerateDailyReviewUseCase(),
      this.createGenerateDailyNotesReviewUseCase(llm),
      this.calendarFactory.createCreateDailyNoteUseCase(),
      llm,
    );
  }

  createAuthService(): PtuneSyncUriAuthService {
    return this.syncFactory.createAuthService();
  }
}
