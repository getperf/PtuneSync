// src/domain/planning/HabitService.ts

import { TaskEntry } from "./TaskEntry";

export class HabitService {
  static buildHabitSet(morning: string[], evening: string[]): Set<string> {
    return new Set([...morning, ...evening]);
  }

  static filterEntries(
    entries: TaskEntry[],
    habitSet: Set<string>,
  ): TaskEntry[] {
    return entries.filter((e) => !habitSet.has(e.title));
  }

  static createHabitSet(...groups: string[][]): Set<string> {
    const set = new Set<string>();

    for (const g of groups) {
      for (const h of g) {
        set.add(h);
      }
    }

    return set;
  }

  static extractTitle(line: string): string {
    return line.replace(/^- \[[ x]\] /, "").trim();
  }

  static isHabitLine(line: string, habitSet: Set<string>): boolean {
    const title = this.extractTitle(line);

    return habitSet.has(title);
  }

  static filterHabitLines(lines: string[], habitSet: Set<string>): string[] {
    return lines.filter((l) => !this.isHabitLine(l, habitSet));
  }

  static collectExistingHabits(lines: string[], habits: string[]): string[] {
    const habitSet = new Set(habits);
    const titles = new Set<string>();

    for (const line of lines) {
      const title = this.extractTitle(line);

      if (habitSet.has(title)) {
        titles.add(title);
      }
    }

    return habits.filter((habit) => titles.has(habit));
  }

  static buildHabitLines(habits: string[]): string[] {
    return habits.map((h) => `- [ ] ${h}`);
  }

  static isHabitTitle(title: string, habitSet: Set<string>): boolean {
    return habitSet.has(title);
  }

  static hasAnyHabit(entries: TaskEntry[], habitSet: Set<string>): boolean {
    for (const e of entries) {
      if (this.isHabitTitle(e.title, habitSet)) {
        return true;
      }
    }

    return false;
  }

  static hasHabitLines(lines: string[], habitSet: Set<string>): boolean {
    for (const line of lines) {
      const m = line.match(/^- \[.\] (.+)$/);

      if (!m) continue;

      const title = m[1];

      if (this.isHabitTitle(title, habitSet)) {
        return true;
      }
    }

    return false;
  }
}
