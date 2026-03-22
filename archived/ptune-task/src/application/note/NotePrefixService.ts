import { logger } from "../../shared/logger/loggerInstance";

export type NotePrefixMode = "serial" | "date";

export class NotePrefixService {
  getNextPrefix(
    items: string[],
    mode: NotePrefixMode,
    digits: number,
    now: Date = new Date(),
  ): string {
    if (mode === "date") {
      return this.getDatePrefix(now);
    }

    return this.getNextSerialPrefix(items, digits);
  }

  private getNextSerialPrefix(items: string[], digits: number): string {
    const regex = /^(\d+)_/;
    let max = 0;

    for (const item of items) {
      const match = item.match(regex);

      if (!match || !match[1]) {
        continue;
      }

      const num = Number.parseInt(match[1], 10);

      if (!Number.isNaN(num)) {
        max = Math.max(max, num);
      }
    }

    const next = max + 1;
    const result = next
      .toString()
      .padStart(digits, "0")
      .replace(/^0+(\d{4,})$/, "$1");

    logger.debug(`[Service] NotePrefixService.getNextSerialPrefix max=${max} next=${next} result=${result}`);

    return result;
  }

  private getDatePrefix(now: Date): string {
    const yyyy = now.getFullYear();
    const MM = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");

    return `${yyyy}${MM}${dd}${hh}${mm}${ss}`;
  }
}
