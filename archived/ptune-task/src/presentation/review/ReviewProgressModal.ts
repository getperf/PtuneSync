import { App, Modal } from "obsidian";
import { DailyReviewFlowProgressEvent } from "../../application/review_flow/types/DailyReviewFlowProgressEvent";
import { i18n } from "../../shared/i18n/I18n";

export class ReviewProgressModal extends Modal {
  private static readonly LOG_MIN_HEIGHT_PX = 120;
  private static readonly LOG_MAX_HEIGHT_PX = 160;

  private statusEl?: HTMLElement;
  private logEl?: HTMLElement;
  private readonly lines: string[] = [];
  private autoCloseTimer: number | null = null;

  constructor(app: App) {
    super(app);
  }

  onOpen(): void {
    const t = i18n.common.reviewFlow.progress;
    const { contentEl } = this;

    contentEl.createEl("h2", { text: t.title });
    this.statusEl = contentEl.createEl("p", { text: t.running });

    const logContainer = contentEl.createDiv();
    logContainer.style.border = "1px solid var(--background-modifier-border)";
    logContainer.style.borderRadius = "8px";
    logContainer.style.backgroundColor = "var(--background-secondary)";
    logContainer.style.padding = "10px 12px";
    logContainer.style.minHeight = `${ReviewProgressModal.LOG_MIN_HEIGHT_PX}px`;
    logContainer.style.maxHeight = `${ReviewProgressModal.LOG_MAX_HEIGHT_PX}px`;
    logContainer.style.overflowY = "auto";

    this.logEl = logContainer.createEl("pre");
    this.logEl.style.margin = "0";
    this.logEl.style.whiteSpace = "pre-wrap";
    this.logEl.style.wordBreak = "break-word";
    this.logEl.style.lineHeight = "1.5";
  }

  onClose(): void {
    if (this.autoCloseTimer !== null) {
      window.clearTimeout(this.autoCloseTimer);
      this.autoCloseTimer = null;
    }
    this.contentEl.empty();
  }

  handleEvent(event: DailyReviewFlowProgressEvent): void {
    const t = i18n.common.reviewFlow.progress;

    switch (event.type) {
      case "started":
        this.appendLine(`${t.events.started}: ${event.date}`);
        return;
      case "task_review_started":
        this.appendLine(`${t.events.taskReviewStarted}: ${event.date}`);
        return;
      case "task_review_skipped":
        this.appendLine(t.events.taskReviewSkipped);
        return;
      case "task_review_completed":
        this.appendLine(`${t.events.taskReviewCompleted}: ${event.taskCount}`);
        return;
      case "daily_notes_review_started":
        this.appendLine(`${t.events.notesReviewStarted}: ${event.date} (${event.targetCount})`);
        return;
      case "daily_notes_review_progress":
        this.appendLine(`${t.events.notesReviewProgress}: ${event.completed}/${event.total} ${event.path}`);
        return;
      case "daily_notes_review_skipped":
        this.appendLine(`${t.events.notesReviewSkipped}: ${event.reason}`);
        return;
      case "daily_notes_review_completed":
        this.appendLine(`${t.events.notesReviewCompleted}: ${event.noteCount}/${event.generatedCount}`);
        return;
      case "completed":
        return;
      case "failed":
        this.markFailed(event.message);
        return;
    }
  }

  markCompleted(): void {
    const t = i18n.common.reviewFlow.progress;
    if (this.statusEl) {
      this.statusEl.setText(t.completed);
    }
    this.autoCloseTimer = window.setTimeout(() => this.close(), 3000);
  }

  markFailed(message: string): void {
    const t = i18n.common.reviewFlow.progress;
    if (this.statusEl) {
      this.statusEl.setText(`${t.failed}: ${message}`);
    }
    this.appendLine(`${t.failed}: ${message}`);
  }

  private appendLine(line: string): void {
    this.lines.push(line);
    if (this.logEl) {
      this.logEl.setText(this.lines.join("\n"));
    }
  }
}
