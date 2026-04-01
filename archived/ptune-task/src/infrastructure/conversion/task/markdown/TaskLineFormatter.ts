export type TaskLineFormatMode = "strict" | "relaxed";

export interface TaskLineFormatInput {
  title: string;
  pomodoroPlanned: number | null;
  tags?: string[];
  goal?: string | null;
}

export class TaskLineFormatter {
  static format(
    input: TaskLineFormatInput,
    mode: TaskLineFormatMode = "relaxed",
  ): string {
    const parts: string[] = [];

    // 1. title
    const title = input.title.trim();
    parts.push(title);

    // 2. tags
    const tags = input.tags ?? [];
    const tagList = mode === "strict" ? [...tags].sort() : tags;

    if (tagList.length > 0) {
      parts.push(tagList.map((t) => `#${t}`).join(" "));
    }

    // 3. pomodoro
    if (input.pomodoroPlanned != null && input.pomodoroPlanned > 0) {
      parts.push(`🍅x${input.pomodoroPlanned}`);
    }

    let line = parts.join(" ");

    // 4. goal
    if (input.goal) {
      line += ` | ${input.goal.trim()}`;
    }

    return line;
  }
}
