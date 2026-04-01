import { App, Modal } from "obsidian";
import { ConfirmPort } from "../../application/sync/push/PushSyncUseCase";
import { i18n } from "../../shared/i18n/I18n";

type ConfirmSummary = Parameters<ConfirmPort["confirm"]>[0];

export class ObsidianConfirmDialog implements ConfirmPort {
  constructor(private readonly app: App) {}

  confirm(summary: ConfirmSummary): Promise<boolean> {
    return new Promise((resolve) => {
      new ConfirmModal(this.app, summary, resolve).open();
    });
  }
}

class ConfirmModal extends Modal {
  private resolved = false;

  constructor(
    app: App,
    private readonly summary: ConfirmSummary,
    private readonly resolve: (result: boolean) => void,
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    const common = i18n.common;

    contentEl.createEl("h3", { text: this.summary.title });
    contentEl.createEl("p", { text: this.summary.message });
    contentEl.createEl("p", {
      text: `${common.push.confirm.summary.create}: ${this.summary.diff.create}`,
    });
    contentEl.createEl("p", {
      text: `${common.push.confirm.summary.update}: ${this.summary.diff.update}`,
    });
    contentEl.createEl("p", {
      text: `${common.push.confirm.summary.delete}: ${this.summary.diff.delete}`,
    });

    const btnDiv = contentEl.createDiv({ cls: "modal-button-container" });

    btnDiv.createEl("button", { text: common.action.confirm }).addEventListener("click", () => {
      this.done(true);
    });

    btnDiv.createEl("button", { text: common.action.cancel }).addEventListener("click", () => {
      this.done(false);
    });
  }

  onClose(): void {
    this.done(false);
    this.contentEl.empty();
  }

  private done(result: boolean): void {
    if (this.resolved) return;
    this.resolved = true;
    this.resolve(result);
    this.close();
  }
}
