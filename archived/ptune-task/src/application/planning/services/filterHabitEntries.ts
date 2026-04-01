// src/application/planning/services/filterHabitEntries.ts

import { TaskEntry } from "../../../domain/task/TaskEntry";

export function filterHabitEntries(
  entries: TaskEntry[],
  morningHabits: string[],
  eveningHabits: string[],
): TaskEntry[] {

  const habitSet = new Set([
    ...morningHabits,
    ...eveningHabits,
  ]);

  return entries.filter((e) => !habitSet.has(e.title));
}
