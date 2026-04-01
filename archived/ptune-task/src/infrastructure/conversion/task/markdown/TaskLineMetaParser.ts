export class TaskLineFormatError extends Error {}

export type TaskLineMeta = {
  title: string;
  tags: string[];
  goal: string | null;
  pomodoroPlanned: number | null;
};

export class TaskLineMetaParser {
  static parse(raw: string): TaskLineMeta {
    const trimmed = raw.trim();
    if (!trimmed) {
      throw new TaskLineFormatError("Empty task line");
    }

    this.validatePipeCount(trimmed);

    const { left, goal } = this.extractGoal(trimmed);
    this.validateTagAfterGoal(trimmed, goal);

    const { withoutTags, tags } = this.extractTags(left);
    const { title, pomodoroPlanned } = this.extractPomodoro(withoutTags);

    if (!title.trim()) {
      throw new TaskLineFormatError("Title is empty");
    }

    return {
      title: title.trim(),
      tags,
      goal,
      pomodoroPlanned,
    };
  }

  private static validatePipeCount(input: string): void {
    const count = (input.match(/\|/g) || []).length;
    if (count > 1) {
      throw new TaskLineFormatError("Multiple '|' not allowed");
    }
  }

  private static extractGoal(input: string): {
    left: string;
    goal: string | null;
  } {
    const idx = input.indexOf("|");
    if (idx < 0) return { left: input, goal: null };

    return {
      left: input.slice(0, idx).trim(),
      goal: input.slice(idx + 1).trim() || null,
    };
  }

  private static validateTagAfterGoal(
    original: string,
    goal: string | null,
  ): void {
    if (!goal) return;
    if (/#/.test(goal)) {
      throw new TaskLineFormatError("Tag not allowed after goal");
    }
  }

  private static extractTags(input: string): {
    withoutTags: string;
    tags: string[];
  } {
    const tagRegex = /(?:^|\s)#([^\s#|]+)/g;
    const tags: string[] = [];

    const withoutTags = input.replace(tagRegex, (_, tag) => {
      tags.push(tag);
      return "";
    });

    return {
      withoutTags: withoutTags.trim(),
      tags,
    };
  }

  private static extractPomodoro(input: string): {
    title: string;
    pomodoroPlanned: number | null;
  } {
    // 🍅x が含まれるか事前チェック
    if (!input.includes("🍅x")) {
      return {
        title: input,
        pomodoroPlanned: null,
      };
    }

    // 厳密形式：正の整数のみ許可
    const strictRegex = /🍅x([1-9][0-9]*)/;
    const match = input.match(strictRegex);

    if (!match) {
      throw new TaskLineFormatError("Invalid pomodoro format");
    }

    const value = Number(match[1]);

    return {
      title: input.replace(strictRegex, "").trim(),
      pomodoroPlanned: value,
    };
  }
}
