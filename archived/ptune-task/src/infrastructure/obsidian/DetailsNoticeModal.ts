import { App, Modal, Setting } from "obsidian";
import { i18n } from "../../shared/i18n/I18n";

export class DetailsNoticeModal extends Modal {
  constructor(
    app: App,
    private readonly titleText: string,
    private readonly details: string,
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;

    this.modalEl.addClass("ptune-details-notice-modal");
    contentEl.createEl("h2", { text: this.titleText });
    contentEl.createEl("pre", {
      cls: "ptune-details-notice-pre",
      text: this.details,
    });

    new Setting(contentEl)
      .setClass("ptune-details-notice-actions")
      .addButton((button) =>
        button
          .setButtonText(i18n.common.action.close)
          .setCta()
          .onClick(() => {
            this.close();
          }),
      );
  }

  onClose(): void {
    this.modalEl.removeClass("ptune-details-notice-modal");
    this.contentEl.empty();
  }
}
