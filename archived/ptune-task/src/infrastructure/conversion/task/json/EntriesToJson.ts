// src/task-io/transforms/json/EntriesToJson.ts

import { DeletedTaskEntry } from "../../../../domain/task/DeletedTaskEntry";
import { TaskEntry } from "../../../../domain/task/TaskEntry";
import { TaskDocumentTask } from "../../../../domain/task/TaskDocument";
import { CURRENT_SCHEMA_VERSION } from "../schema/schema";


export class EntriesToJson {
  static build(tasks: TaskEntry[], deletedTasks: DeletedTaskEntry[]): string {
    return JSON.stringify(
      {
        schema_version: CURRENT_SCHEMA_VERSION,
        tasks: tasks.map((e): TaskDocumentTask => ({
          id: e.id,
          title: e.title,

          // snake_case に統一
          parent: e.parentId ?? null,
          parent_key: e.parentKey ?? null,
          pomodoro_planned: e.pomodoroPlanned ?? null,

          // 将来拡張（既定値）
          // pomodoro_actual: null,
          // review_flags: [],
          // started: null,
          // completed: null,
          // status: "needsAction",

          tags: e.tags ?? [],
          goal: e.goal ?? null,
        })),
        deleted_tasks: deletedTasks.map((d) => ({
          id: d.id,
          composite_key: d.compositeKey,
          parent_title: d.parentTitle,
          title: d.title,
        })),
      },
      null,
      2,
    );
  }
}
