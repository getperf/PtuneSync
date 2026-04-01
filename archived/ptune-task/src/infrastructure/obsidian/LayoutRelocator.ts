import { App, WorkspaceLeaf } from "obsidian";
import { logger } from "../../shared/logger/loggerInstance";

export class LayoutRelocator {
  constructor(private readonly app: App) {}

  hasViewInLeftPane(viewTypeToCheck: string): boolean {
    let found = false;

    this.app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
      if (found) {
        return;
      }

      const viewType = leaf.view?.getViewType();
      const isInLeftDock = leaf.getRoot() === this.app.workspace.leftSplit;

      if (isInLeftDock && viewType === viewTypeToCheck) {
        found = true;
      }
    });

    return found;
  }

  async openViewInLeftPane(
    viewType: string,
    split = false,
    makeActive = false,
  ): Promise<void> {
    const leaf = this.app.workspace.getLeftLeaf(split);

    if (!leaf) {
      logger.warn(`[Service] LayoutRelocator.openViewInLeftPane missingLeftLeaf type=${viewType}`);
      return;
    }

    await leaf.setViewState({
      type: viewType,
      active: makeActive,
    });
  }

  relocateOutlineIconBar(): void {
    const outlineLeaf = document.querySelector(
      '.workspace-leaf-content[data-type="outline"]',
    );

    if (!outlineLeaf) {
      logger.debug("[Service] LayoutRelocator.relocateOutlineIconBar outlineLeafMissing");
      return;
    }

    const leaf = outlineLeaf.closest(".workspace-leaf");
    const tabs = leaf?.closest(".workspace-tabs");
    const spacer = tabs?.querySelector(".workspace-tab-header-spacer");
    const navButtons = leaf?.querySelector(".nav-buttons-container");

    if (!spacer || !navButtons) {
      logger.debug("[Service] LayoutRelocator.relocateOutlineIconBar targetMissing");
      return;
    }

    spacer.prepend(navButtons);
  }

  async ensureDefaultViewsInLeftPane(): Promise<void> {
    logger.debug("[Service] LayoutRelocator.ensureDefaultViewsInLeftPane start");

    const defaultViews: ReadonlyArray<readonly [string, boolean]> = [
      ["file-explorer", false],
      ["outline", true],
    ];

    for (const [viewType, split] of defaultViews) {
      if (!this.hasViewInLeftPane(viewType)) {
        await this.openViewInLeftPane(viewType, split);
      }
    }

    this.relocateOutlineIconBar();

    logger.debug("[Service] LayoutRelocator.ensureDefaultViewsInLeftPane end");
  }
}
