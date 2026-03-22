// src/application/calendar/TodayResolver.ts

export class TodayResolver {
  constructor(private readonly timeZone?: string) { }

  resolve(): string {
    const tz = this.normalizeTimeZone(this.timeZone);

    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    return formatter.format(new Date());
  }

  private normalizeTimeZone(
    tz?: string,
  ): string | undefined {
    if (!tz || tz.trim() === "") {
      return undefined; // ローカルTZ
    }

    try {
      // バリデーション用
      new Intl.DateTimeFormat("en-US", { timeZone: tz });
      return tz;
    } catch {
      console.warn(
        `[TodayResolver] Invalid timezone "${tz}", fallback to local.`,
      );
      return undefined;
    }
  }
}