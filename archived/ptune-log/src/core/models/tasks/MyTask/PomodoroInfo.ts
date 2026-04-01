export class PomodoroInfo {
  constructor(public planned: number, public actual?: number) {}

  toString(): string {
    const planned = this.planned !== undefined ? `🍅x${this.planned}` : '';
    const actual = this.actual !== undefined ? `✅x${this.actual}` : '';
    return `${planned}${actual ? ' ' + actual : ''}`;
  }

  done(count = 1): void {
    if (this.actual === undefined) this.actual = 0;
    this.actual += count;
  }
}
