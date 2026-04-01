// src/domain/execution/MyTask.ts

export type TaskStatus = "needsAction" | "completed";

export type ReviewFlag = string;

export class MyTask {
  constructor(
    // --- Google準拠 ---
    public id: string,
    public title: string,
    public tasklistId: string,
    public notes: string | null = null,
    public parent: string | null = null,
    public position: string | null = null,
    public status: TaskStatus = "needsAction",
    public due: string | null = null, // RFC3339
    public completed: string | null = null, // RFC3339
    public updated: string | null = null, // Google updated
    public deleted: boolean = false,

    // --- ptune拡張（計画系） ---
    public pomodoroPlanned: number | null = null,
    public goal: string | null = null,
    public tags: string[] = [],

    // --- ptune拡張（実績系） ---
    public pomodoroActual: number | null = null,
    public reviewFlags: ReviewFlag[] = [],
    public started: string | null = null,

    // --- 同期管理 ---
    public googleUpdatedAt: string | null = null,
    public localUpdatedAt: string | null = null,
  ) {}

  get isCompleted(): boolean {
    return this.status === "completed";
  }

  normalizeTags(): void {
    this.tags = [
      ...new Set(this.tags.map((t) => t.trim()).filter(Boolean)),
    ].sort();
  }

  toJSON(): object {
    return {
      id: this.id,
      title: this.title,
      tasklist_id: this.tasklistId,
      notes: this.notes,
      parent: this.parent,
      position: this.position,
      status: this.status,
      due: this.due,
      completed: this.completed,
      updated: this.updated,
      deleted: this.deleted,
      pomodoro_planned: this.pomodoroPlanned,
      pomodoro_actual: this.pomodoroActual,
      review_flags: this.reviewFlags,
      started: this.started,
      tags: this.tags,
      goal: this.goal,
      google_updated_at: this.googleUpdatedAt,
      local_updated_at: this.localUpdatedAt,
    };
  }
}
