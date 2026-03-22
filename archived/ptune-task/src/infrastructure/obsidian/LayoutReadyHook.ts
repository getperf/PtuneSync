import { App } from "obsidian";
import { logger } from "../../shared/logger/loggerInstance";
import { LayoutRelocator } from "./LayoutRelocator";

export class LayoutReadyHook {
  constructor(
    private readonly app: App,
    private readonly relocator: LayoutRelocator,
  ) {}

  start(): void {
    this.app.workspace.onLayoutReady(() => {
      void this.handleLayoutReady();
    });
  }

  private async handleLayoutReady(): Promise<void> {
    logger.debug("[Service] LayoutReadyHook.handleLayoutReady start");

    try {
      await this.relocator.ensureDefaultViewsInLeftPane();
    } catch (error) {
      logger.warn("[Service] LayoutReadyHook.handleLayoutReady failed", error);
    }

    logger.debug("[Service] LayoutReadyHook.handleLayoutReady end");
  }
}
