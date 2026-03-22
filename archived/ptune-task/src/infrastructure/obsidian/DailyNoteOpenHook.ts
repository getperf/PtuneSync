import { App, Plugin, TFile } from "obsidian";
import { EnsureTodayDailyNoteSectionsUseCase } from "../../application/calendar/usecases/EnsureTodayDailyNoteSectionsUseCase";
import { logger } from "../../shared/logger/loggerInstance";

export class DailyNoteOpenHook {
  constructor(
    private readonly app: App,
    private readonly useCase: EnsureTodayDailyNoteSectionsUseCase,
  ) {}

  start(plugin: Plugin): void {
    this.app.workspace.onLayoutReady(() => {
      plugin.registerEvent(
        this.app.workspace.on("file-open", (file) => {
          void this.handleFileOpen(file);
        }),
      );
    });
  }

  private async handleFileOpen(file: TFile | null): Promise<void> {
    try {
      await this.useCase.execute(file);
    } catch (error) {
      logger.warn("DailyNoteOpenHook failed", error);
    }
  }
}
