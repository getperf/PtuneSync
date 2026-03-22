// src/task-io/models/TaskEntry.ts

export interface TaskEntry {
  id: string;
  title: string;
  parentId: string | null;
  parentKey: string | null;
  pomodoroPlanned: number | null;
  tags: string[];
  goal: string | null;
}
