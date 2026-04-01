import { App } from "obsidian";
import { NoteCreationUseCase } from "../../application/note/NoteCreationUseCase";
import { NotePrefixService } from "../../application/note/NotePrefixService";
import { TaskKeyOptionBuilder } from "../../application/note/TaskKeyOptionBuilder";
import { ProjectIndexBuilder } from "../../infrastructure/document/project/ProjectIndexBuilder";
import { ProjectNoteBuilder } from "../../infrastructure/document/note/ProjectNoteBuilder";
import { TodayTaskKeyReader } from "../../infrastructure/obsidian/TodayTaskKeyReader";
import { ProjectRepository } from "../../infrastructure/repository/ProjectRepository";
import { NoteCreationFeature } from "../../presentation/note/NoteCreationFeature";
import { PtuneRuntime } from "../../shared/PtuneRuntime";
import { CalendarFactory } from "./CalendarFactory";

export class NoteFactory {
  constructor(
    private readonly app: App,
    private readonly runtime: PtuneRuntime,
    private readonly calendarFactory: CalendarFactory,
  ) {}

  createNoteCreationUseCase(): NoteCreationUseCase {
    return new NoteCreationUseCase(
      new ProjectRepository(this.runtime, this.app),
      new NotePrefixService(),
      new ProjectIndexBuilder(),
      new ProjectNoteBuilder(),
      this.calendarFactory.createTodayResolver(),
      this.runtime,
    );
  }

  createNoteCreationFeature(): NoteCreationFeature {
    return new NoteCreationFeature(
      this.app,
      this.createNoteCreationUseCase(),
      new TodayTaskKeyReader(
        this.app,
        this.runtime,
        this.calendarFactory.createTodayResolver(),
        new TaskKeyOptionBuilder(),
      ),
    );
  }
}
