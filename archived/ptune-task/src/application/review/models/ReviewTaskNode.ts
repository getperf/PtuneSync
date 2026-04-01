export class ReviewTaskNode {
  readonly id: string;
  readonly title: string;
  readonly status?: string | null;

  readonly pomodoroPlanned?: number | null;
  readonly pomodoroActual?: number | null;

  readonly started?: string | null;
  readonly completed?: string | null;

  readonly tags: string[];
  readonly goal?: string | null;
  readonly reviewFlags: string[];

  readonly children: ReviewTaskNode[];

  constructor(params: {
    id: string;
    title: string;
    status?: string | null;
    pomodoroPlanned?: number | null;
    pomodoroActual?: number | null;
    started?: string | null;
    completed?: string | null;
    tags?: string[] | null;
    goal?: string | null;
    reviewFlags?: string[] | null;
    children?: ReviewTaskNode[];
  }) {
    this.id = params.id;
    this.title = params.title;
    this.status = params.status ?? null;

    this.pomodoroPlanned = params.pomodoroPlanned ?? null;
    this.pomodoroActual = params.pomodoroActual ?? null;

    this.started = params.started ?? null;
    this.completed = params.completed ?? null;

    this.tags = params.tags ?? [];
    this.goal = params.goal ?? null;
    this.reviewFlags = params.reviewFlags ?? [];
    this.children = params.children ?? [];
  }

  isCompleted(): boolean {
    return this.status === "completed";
  }

  isUnfinished(): boolean {
    return !this.isCompleted();
  }

  /**
   * 自ノード + 子孫の pomodoroActual 合計（tag集計などに利用）
   */
  totalPomodoroActual(): number {
    const self = this.pomodoroActual ?? 0;
    return (
      self + this.children.reduce((s, c) => s + c.totalPomodoroActual(), 0)
    );
  }
}
