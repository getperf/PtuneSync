import { App } from "obsidian";
import { ObsidianConfirmDialog } from "../../infrastructure/obsidian/ObsidianConfirmDialog";
import { ObsidianPresenter } from "../../infrastructure/obsidian/ObsidianPresenter";

export class PresentationFactory {
  constructor(private readonly app: App) {}

  createObsidianPresenter(): ObsidianPresenter {
    return new ObsidianPresenter(this.app);
  }

  createConfirmDialog(): ObsidianConfirmDialog {
    return new ObsidianConfirmDialog(this.app);
  }
}
