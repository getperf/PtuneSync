import { App } from "obsidian";
import { DailyReviewFlowProgressEvent } from "../../application/review_flow/types/DailyReviewFlowProgressEvent";
import { logger } from "../../shared/logger/loggerInstance";
import { ReviewProgressModal } from "./ReviewProgressModal";

type TerminalState =
  | { type: "completed" }
  | { type: "failed"; message: string }
  | null;

export class ReviewProgressController {
  private readonly events: DailyReviewFlowProgressEvent[] = [];
  private currentModal: ReviewProgressModal | null = null;
  private isRunning = true;
  private terminalState: TerminalState = null;

  constructor(
    private readonly app: App,
    private readonly date: string,
  ) {}

  open(): void {
    this.currentModal = this.openModal();
  }

  handleEvent(event: DailyReviewFlowProgressEvent): void {
    this.events.push(event);
    this.currentModal?.handleEvent(event);
  }

  markCompleted(): void {
    this.isRunning = false;
    this.terminalState = { type: "completed" };
    this.currentModal?.markCompleted();
  }

  markFailed(message: string): void {
    this.isRunning = false;
    this.terminalState = { type: "failed", message };
    this.currentModal?.markFailed(message);
  }

  private openModal(): ReviewProgressModal {
    const modal = new ReviewProgressModal(this.app);
    modal.setCloseCallback(() => {
      if (!this.isRunning || this.terminalState) {
        this.currentModal = null;
        return;
      }

      this.currentModal = null;
      logger.warn(`[Command] ReviewProgressController modal closed unexpectedly date=${this.date}`);
      window.setTimeout(() => {
        if (!this.isRunning || this.terminalState || this.currentModal) {
          return;
        }
        this.currentModal = this.openModal();
      }, 50);
    });
    modal.open();

    for (const event of this.events) {
      modal.handleEvent(event);
    }

    if (this.terminalState?.type === "completed") {
      modal.markCompleted();
    } else if (this.terminalState?.type === "failed") {
      modal.markFailed(this.terminalState.message);
    }

    return modal;
  }
}
