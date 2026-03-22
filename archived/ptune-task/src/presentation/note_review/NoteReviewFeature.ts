import { App, Notice, Plugin, TFile } from "obsidian";
import { TextGenerationPort } from "../../application/llm/ports/TextGenerationPort";
import { PreviewNoteSummaryUseCase } from "../../application/note_review/usecases/PreviewNoteSummaryUseCase";
import { SaveNoteSummaryUseCase } from "../../application/note_review/usecases/SaveNoteSummaryUseCase";
import { i18n } from "../../shared/i18n/I18n";
import { logger } from "../../shared/logger/loggerInstance";
import { NoteSummaryModal } from "./NoteSummaryModal";

export class NoteReviewFeature {
  constructor(
    private readonly app: App,
    private readonly textGenerator: TextGenerationPort,
    private readonly previewUseCase: PreviewNoteSummaryUseCase,
    private readonly saveUseCase: SaveNoteSummaryUseCase,
  ) {}

  start(plugin: Plugin): void {
    plugin.addCommand({
      id: "note-review-current",
      name: i18n.common.noteReview.command.current,
      callback: () => {
        void this.openForActiveFile();
      },
    });

    plugin.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (!(file instanceof TFile) || file.extension !== "md") {
          return;
        }

        menu.addItem((item) =>
          item
            .setTitle(i18n.common.noteReview.command.menu)
            .setIcon("bot")
            .onClick(() => {
              void this.open(file);
            }),
        );
      }),
    );
  }

  private async openForActiveFile(): Promise<void> {
    const file = this.app.workspace.getActiveFile();

    if (!file) {
      new Notice(i18n.common.noteReview.notice.noActiveNote);
      return;
    }

    await this.open(file);
  }

  private async open(file: TFile): Promise<void> {
    if (!this.textGenerator.hasValidApiKey()) {
      new Notice(i18n.common.noteReview.notice.apiKeyNotSet);
      return;
    }

    try {
      const preview = await this.previewUseCase.execute(file);
      new NoteSummaryModal(
        this.app,
        preview,
        async (value) => {
          await this.saveUseCase.execute(file, value);
          new Notice(i18n.common.noteReview.notice.saved);
        },
        async () => await this.previewUseCase.execute(file),
      ).open();
    } catch (error) {
      logger.warn("[Command] NoteReviewFeature.open failed", error);
      new Notice(i18n.common.noteReview.notice.failed);
    }
  }
}
