import { App } from "obsidian";
import { DailyNoteOpenHook } from "../../infrastructure/obsidian/DailyNoteOpenHook";
import { LayoutReadyHook } from "../../infrastructure/obsidian/LayoutReadyHook";
import { LayoutRelocator } from "../../infrastructure/obsidian/LayoutRelocator";
import { CalendarFactory } from "./CalendarFactory";

export class HookFactory {
  constructor(
    private readonly app: App,
    private readonly calendarFactory: CalendarFactory,
  ) {}

  createDailyNoteOpenHook(): DailyNoteOpenHook {
    return new DailyNoteOpenHook(
      this.app,
      this.calendarFactory.createEnsureTodayDailyNoteSectionsUseCase(),
    );
  }

  createLayoutReadyHook(): LayoutReadyHook {
    return new LayoutReadyHook(this.app, new LayoutRelocator(this.app));
  }
}
