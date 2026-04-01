// src/domain/planning/TaskDocument.ts

import { TaskEntry } from "./TaskEntry";
import { DeletedTaskEntry } from "./DeletedTaskEntry";

/**
 * Representation of a task inside the JSON document that is persisted to disk.
 *
 * The field names use snake_case (as required by the external storage format),
 * but otherwise the shape mirrors `TaskEntry`.  We build this type by taking
 * the camel‑cased `TaskEntry` and mapping just the three properties whose names
 * differ.  Exporting the type lets callers such as normalizers refer to it and
 * keeps the shape in a single location.
 */
export type TaskDocumentTask =
  Omit<TaskEntry, "parentId" | "parentKey" | "pomodoroPlanned"> & {
    parent: string | null;
    parent_key: string | null;
    pomodoro_planned: number | null;
  };

export interface TaskDocument {
  schemaVersion: number;
  tasks: TaskDocumentTask[];
  deletedTasks: DeletedTaskEntry[];
}

export class TaskDocumentFactory {
  static fromJson(json: string): TaskDocument {
    const obj = JSON.parse(json);

    if (typeof obj !== "object" || obj === null || !Array.isArray(obj.tasks)) {
      throw new Error("Invalid TaskDocument JSON");
    }

    return {
      schemaVersion: obj.schema_version,
      tasks: obj.tasks,
      deletedTasks: obj.deleted_tasks ?? [],
    };
  }
}
