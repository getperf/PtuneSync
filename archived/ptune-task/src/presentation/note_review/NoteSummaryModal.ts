import { App, Modal, Setting } from "obsidian";
import { i18n } from "../../shared/i18n/I18n";

export class NoteSummaryModal extends Modal {
  private value: string;
  private textAreaEl: HTMLTextAreaElement | null = null;

  constructor(
    app: App,
    initialValue: string,
    private readonly onSave: (value: string) => Promise<void>,
    private readonly onRegenerate: () => Promise<string>,
  ) {
    super(app);
    this.value = initialValue;
  }

  onOpen(): void {
    const t = i18n.common.noteReview;
    const { contentEl } = this;

    this.modalEl.addClass("ptune-note-summary-modal");
    contentEl.createEl("h2", { text: t.modal.title });

    const fieldEl = contentEl.createDiv({ cls: "ptune-note-summary-field" });
    fieldEl.createEl("label", {
      text: t.modal.summaryLabel,
      cls: "ptune-note-summary-label",
    });

    this.textAreaEl = fieldEl.createEl("textarea", {
      cls: "ptune-note-summary-textarea",
    });
    this.textAreaEl.value = this.value;
    this.textAreaEl.addEventListener("input", () => {
      this.value = this.textAreaEl?.value ?? "";
    });

    new Setting(contentEl)
      .setClass("ptune-note-summary-actions")
      .addButton((button) =>
        button
          .setButtonText(t.modal.regenerate)
          .onClick(() => {
            void this.regenerate();
          }),
      )
      .addButton((button) =>
        button
          .setButtonText(t.modal.save)
          .setCta()
          .onClick(() => {
            void this.save();
          }),
      );
  }

  onClose(): void {
    this.modalEl.removeClass("ptune-note-summary-modal");
    this.textAreaEl = null;
    this.contentEl.empty();
  }

  private async regenerate(): Promise<void> {
    this.value = await this.onRegenerate();
    if (this.textAreaEl) {
      this.textAreaEl.value = this.value;
    }
  }

  private async save(): Promise<void> {
    await this.onSave(this.value);
    this.close();
  }
}
