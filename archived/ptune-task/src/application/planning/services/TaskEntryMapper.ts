import { ParsedTaskNode } from "../../../domain/task/dto/ParsedTaskNode";
import { TaskEntry } from "../../../domain/task/TaskEntry";
import { HabitService } from "../../../domain/task/HabitService";

/**
 * ParsedTaskNode → TaskEntry 生成専用
 * TaskEntry DTO 生成責務を集中
 */
export class TaskEntryMapper {
  static create(node: ParsedTaskNode): TaskEntry {
    return {
      id: "",
      title: node.title,
      parentId: null,
      parentKey: null,
      pomodoroPlanned: node.pomodoroPlanned,
      tags: node.tags ?? [],
      goal: node.goal,
    };
  }

  static createAll(nodes: ParsedTaskNode[]): TaskEntry[] {
    return nodes.map((n) => this.create(n));
  }

  static createHabit(title: string): TaskEntry {
    return {
      id: "",
      title,
      parentId: null,
      parentKey: null,
      pomodoroPlanned: null,
      tags: [],
      goal: null,
    };
  }

  static createHabitEntries(habits: string[]): TaskEntry[] {
    return habits.map((h) => this.createHabit(h));
  }

  /**
   * Habit が一切存在しない場合のみ挿入
   */
  static ensureHabitsIfAbsent(
    entries: TaskEntry[],
    morningHabits: string[],
    eveningHabits: string[],
  ): TaskEntry[] {
    const habitSet = HabitService.createHabitSet(morningHabits, eveningHabits);

    if (HabitService.hasAnyHabit(entries, habitSet)) {
      return entries;
    }

    const morning = this.createHabitEntries(morningHabits);
    const evening = this.createHabitEntries(eveningHabits);

    return [...morning, ...entries, ...evening];
  }
}
