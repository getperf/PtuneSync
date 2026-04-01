import { App, Modal, Setting } from "obsidian";
import { NoteCreationKind } from "../../application/note/NoteCreationModels";
import { TaskKeyOption } from "../../application/note/TaskKeyOption";
import { i18n } from "../../shared/i18n/I18n";
import { logger } from "../../shared/logger/loggerInstance";

export interface NoteCreatorModalSubmit {
  title: string;
  taskKey?: string;
  goal?: string;
}

export class NoteCreatorModal extends Modal {
  private title = "";
  private taskKey: string | undefined;
  private isTitleEdited = false;

  constructor(
    app: App,
    private readonly kind: NoteCreationKind,
    private readonly targetPath: string,
    private readonly prefix: string,
    private readonly taskKeyOptions: TaskKeyOption[],
    private readonly onSubmit: (input: NoteCreatorModalSubmit) => Promise<boolean>,
  ) {
    super(app);
  }

  onOpen(): void {
    const t = i18n.common.noteCreation;
    const action = i18n.common.action;
    const { contentEl } = this;

    logger.debug(`[Command] NoteCreatorModal.onOpen kind=${this.kind} target=${this.targetPath} prefix=${this.prefix}`);

    contentEl.createEl("h2", {
      text:
        this.kind === "project-folder"
          ? t.modal.projectFolderTitle
          : t.modal.projectNoteTitle,
    });

    contentEl.createEl("p", {
      text: `${t.modal.targetLabel}: ${this.targetPath}`,
      cls: "ptune-note-create-target",
    });

    let titleInputEl: HTMLInputElement | null = null;

    if (this.taskKeyOptions.length > 0) {
      new Setting(contentEl)
        .setName(t.modal.taskKeyLabel)
        .addDropdown((dropdown) => {
          dropdown.addOption("", t.modal.taskKeyEmptyOption);

          for (const option of this.taskKeyOptions) {
            dropdown.addOption(option.taskKey, option.label);
          }

          dropdown.onChange((value) => {
            this.taskKey = value || undefined;

            const selected = this.taskKeyOptions.find((option) => option.taskKey === value);
            logger.debug(`[Command] NoteCreatorModal.taskSelected kind=${this.kind} taskKey=${value || "none"}`);

            if (!selected || this.isTitleEdited || !titleInputEl) {
              return;
            }

            this.title = selected.suggestedTitle;
            titleInputEl.value = selected.suggestedTitle;
          });
        });
    }

    new Setting(contentEl)
      .setName(t.modal.titleLabel)
      .addText((text) => {
        this.decorateTitleInput(text.inputEl);
        titleInputEl = text.inputEl;
        text.inputEl.placeholder = t.modal.titlePlaceholder;
        text.inputEl.addEventListener("keydown", (event) => {
          if (event.key !== "Enter") {
            return;
          }

          event.preventDefault();
          void this.submit();
        });
        text.onChange((value) => {
          this.title = value;
          this.isTitleEdited = true;
        });

        setTimeout(() => text.inputEl.focus(), 0);
      });

    new Setting(contentEl).addButton((button) =>
      button
        .setButtonText(action.create)
        .setCta()
        .onClick(() => {
          void this.submit();
        }),
    );
  }

  onClose(): void {
    logger.debug(`[Command] NoteCreatorModal.onClose kind=${this.kind} target=${this.targetPath}`);
    this.contentEl.empty();
  }

  private decorateTitleInput(textEl: HTMLInputElement): void {
    const container = textEl.parentElement;

    if (!container) {
      return;
    }

    textEl.addClass("long-text-input");

    const prefixSpan = createEl("span", {
      text: `${this.prefix}_`,
      cls: "filename-prefix",
    });
    container.insertBefore(prefixSpan, textEl);

    if (this.kind === "project-note") {
      container.appendChild(createEl("span", {
        text: ".md",
        cls: "filename-suffix",
      }));
    }
  }

  private async submit(): Promise<void> {
    logger.debug(`[Command] NoteCreatorModal.submit kind=${this.kind} target=${this.targetPath}`);

    const completed = await this.onSubmit({
      title: this.title.trim(),
      taskKey: this.taskKey,
    });

    if (completed) {
      this.close();
    }
  }
}
