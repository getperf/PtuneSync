// src/infrastructure/document/daily/DailyNoteFactory.ts

import { DailyNote } from "../../../domain/daily/DailyNote";
import { PtuneRuntime } from "../../../shared/PtuneRuntime";
import { DailyTemplateBuilder } from "./DailyTemplateBuilder";
import { DailyNoteCreator } from "../../../application/calendar/services/DailyNoteCreator";

export class DailyNoteFactory implements DailyNoteCreator {
  constructor(
    private readonly runtime: PtuneRuntime,
    private readonly templateBuilder: DailyTemplateBuilder,
  ) {}

  create(date: string): DailyNote {
    const habits = this.runtime.getHabitTasks();

    const content = this.templateBuilder.build({
      morningHabits: habits.morning,
      eveningHabits: habits.evening,
    });

    const filePath = this.runtime.resolveNoteUri(date);
    return new DailyNote(date, filePath, content);
  }
}
