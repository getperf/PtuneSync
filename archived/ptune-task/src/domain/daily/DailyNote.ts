import { DailyTaskEntry } from "./DailyTaskEntry";
import { DailyReview } from "./DailyReview";

/**
 * DailyNote ドメインモデル
 * - 純粋モデル（VSCode / I/O 非依存）
 */
export class DailyNote {
  constructor(
    readonly date: string,
    readonly filePath: string,
    readonly content: string,

    public readonly tasks?: DailyTaskEntry[],
    public readonly review?: DailyReview | null,
  ) {}

  static empty(date: string, filePath: string): DailyNote {
    return new DailyNote(date, filePath, "");
  }

  withContent(content: string): DailyNote {
    return new DailyNote(
      this.date,
      this.filePath,
      content,
      this.tasks,
      this.review,
    );
  }

  fileName(): string {
    return `${this.date}.md`;
  }
}
