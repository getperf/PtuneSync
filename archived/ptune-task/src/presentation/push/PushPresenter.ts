// src/presentation/push/PushPresenter.ts

import { DailyNote } from "../../domain/daily/DailyNote";

export interface PushPresenter {
  openNote(note: DailyNote): Promise<void>;
  refreshCalendar(): Promise<void>;
  showInfo(message: string): void;
  showError(message: string): void;
  showWarningWithDetails(message: string, details: string): void;
  saveActiveEditor(): Promise<void>;
}
