import { App } from "obsidian";
import { CreateDailyNoteUseCase } from "../../application/calendar/usecases/CreateDailyNoteUseCase";
import { EnsureTodayDailyNoteSectionsUseCase } from "../../application/calendar/usecases/EnsureTodayDailyNoteSectionsUseCase";
import { TodayResolver } from "../../application/calendar/services/TodayResolver";
import { DailyTemplateBuilder } from "../../infrastructure/document/daily/DailyTemplateBuilder";
import { DailyNoteFactory } from "../../infrastructure/document/daily/DailyNoteFactory";
import { PtuneRuntime } from "../../shared/PtuneRuntime";

export class CalendarFactory {
  constructor(
    private readonly _app: App,
    private readonly runtime: PtuneRuntime,
  ) {}

  createTodayResolver(): TodayResolver {
    return new TodayResolver(undefined);
  }

  createDailyNoteFactory(): DailyNoteFactory {
    return new DailyNoteFactory(this.runtime, new DailyTemplateBuilder());
  }

  createCreateDailyNoteUseCase(): CreateDailyNoteUseCase {
    return new CreateDailyNoteUseCase(
      this.runtime.dailyNoteRepository,
      this.createDailyNoteFactory(),
    );
  }

  createEnsureTodayDailyNoteSectionsUseCase(): EnsureTodayDailyNoteSectionsUseCase {
    return new EnsureTodayDailyNoteSectionsUseCase(
      this.createTodayResolver(),
      this.runtime.dailyNoteRepository,
      this.runtime,
    );
  }
}
