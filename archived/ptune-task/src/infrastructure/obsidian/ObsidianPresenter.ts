import { App, MarkdownView, Notice, TFile } from "obsidian";
import { DailyNote } from "../../domain/daily/DailyNote";
import { PullTodayPresenter } from "../../presentation/pull/PullTodayCommand";
import { ReviewPresenter } from "../../presentation/review/ReviewCommand";
import { PushPresenter } from "../../presentation/push/PushPresenter";
import { DetailsNoticeModal } from "./DetailsNoticeModal";

export class ObsidianPresenter
  implements PullTodayPresenter, PushPresenter, ReviewPresenter {
  private static readonly DETAIL_MODAL_THRESHOLD = 160;

  constructor(readonly app: App) { }

  showInfo(message: string): void {
    new Notice(message);
  }

  showError(message: string): void {
    const normalized = this.normalizeErrorMessage(message);

    if (this.shouldOpenDetailsModal(normalized)) {
      new DetailsNoticeModal(this.app, "Error", normalized).open();
      return;
    }

    new Notice(`Error: ${normalized}`);
  }

  showWarningWithDetails(message: string, details: string): void {
    new DetailsNoticeModal(this.app, message, details).open();
  }

  async saveActiveEditor(): Promise<void> {
    // Obsidian は自動保存のため no-op
  }

  async openNote(note: DailyNote): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(note.filePath);
    if (!(file instanceof TFile)) return;

    const leaf = this.app.workspace.getLeaf(false);
    await leaf.openFile(file);

    this.scrollPastFrontmatter();
  }

  async refreshCalendar(): Promise<void> {
    // calendar 廃止のため no-op
  }

  private scrollPastFrontmatter(): void {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return;

    const content = view.editor.getValue();
    const lines = content.split("\n");

    let endLine = 0;
    if (lines[0] === "---") {
      for (let i = 1; i < lines.length; i++) {
        if (lines[i]?.trim() === "---") {
          endLine = i + 1;
          break;
        }
      }
    }

    view.editor.setCursor({ line: endLine, ch: 0 });
  }

  private normalizeErrorMessage(message: string): string {
    const trimmed = message.trim();

    if (trimmed.startsWith("Error: ")) {
      return trimmed.slice("Error: ".length);
    }

    return trimmed;
  }

  private shouldOpenDetailsModal(message: string): boolean {
    return message.includes("\n") || message.length > ObsidianPresenter.DETAIL_MODAL_THRESHOLD;
  }
}
