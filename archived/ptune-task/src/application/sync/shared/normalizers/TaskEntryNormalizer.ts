// src/application/sync/shared/TaskEntryNormalizer.ts

import { TaskEntry } from "../../../../domain/task/TaskEntry";
import { TaskDocument, TaskDocumentTask } from "../../../../domain/task/TaskDocument";

export class TaskEntryNormalizer {
  static toDomain(doc: TaskDocument): TaskEntry[] {
    return doc.tasks.map((t: TaskDocumentTask) => ({
      id: t.id,
      title: t.title,
      parentId: t.parent ?? null,
      parentKey: t.parent_key ?? null,
      pomodoroPlanned: t.pomodoro_planned ?? null,
      tags: t.tags ?? [],
      goal: t.goal ?? null,
    }));
  }
}
