import { DailyNote } from "../../../domain/daily/DailyNote";

export interface DailyNoteCreator {
  create(date: string): DailyNote;
}
