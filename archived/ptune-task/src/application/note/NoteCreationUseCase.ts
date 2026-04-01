import { config } from "../../config/config";
import { NoteSummary } from "../../domain/note/NoteSummary";
import { ProjectFolder } from "../../domain/project/ProjectFolder";
import { ProjectIndexBuilder } from "../../infrastructure/document/project/ProjectIndexBuilder";
import { ProjectNoteBuilder } from "../../infrastructure/document/note/ProjectNoteBuilder";
import { ProjectRepository } from "../../infrastructure/repository/ProjectRepository";
import { PtuneRuntime } from "../../shared/PtuneRuntime";
import { logger } from "../../shared/logger/loggerInstance";
import { TodayResolver } from "../calendar/services/TodayResolver";
import { NoteCreationRequest } from "./NoteCreationModels";
import { NotePrefixService } from "./NotePrefixService";

export class NoteCreationUseCase {
  constructor(
    private readonly repository: ProjectRepository,
    private readonly prefixService: NotePrefixService,
    private readonly projectIndexBuilder: ProjectIndexBuilder,
    private readonly projectNoteBuilder: ProjectNoteBuilder,
    private readonly todayResolver: TodayResolver,
    private readonly runtime: PtuneRuntime,
  ) {}

  async getProjectFolderPrefix(parentPath: string): Promise<string> {
    this.assertProjectRootPath(parentPath);

    return this.getFolderPrefix(parentPath);
  }

  async getProjectNotePrefix(projectFolderPath: string): Promise<string> {
    this.assertProjectFolderPath(projectFolderPath);

    return this.getNotePrefix(projectFolderPath);
  }

  async createProjectFolder(request: NoteCreationRequest): Promise<ProjectFolder> {
    logger.debug(`[UseCase:start] NoteCreationUseCase.createProjectFolder parent=${request.parentPath}`);

    this.assertProjectRootPath(request.parentPath);
    this.assertValidTitle(request.title);

    const prefix = await this.getFolderPrefix(request.parentPath);
    const folder = new ProjectFolder(
      joinPath(request.parentPath, `${prefix}_${request.title.trim()}`),
      normalizeOptionalText(request.taskKey),
      this.buildTodayDailyNoteLink(),
    );

    if (this.repository.exists(folder.path)) {
      throw new Error(`Project folder already exists: ${folder.path}`);
    }

    const createdAt = new Date().toISOString();
    const markdown = this.projectIndexBuilder.build(folder, createdAt);

    await this.repository.createProjectFolder(folder, markdown);

    logger.debug(`[UseCase:end] NoteCreationUseCase.createProjectFolder path=${folder.path}`);

    return folder;
  }

  async createProjectNote(request: NoteCreationRequest): Promise<NoteSummary> {
    logger.debug(`[UseCase:start] NoteCreationUseCase.createProjectNote parent=${request.parentPath}`);

    this.assertProjectFolderPath(request.parentPath);
    this.assertValidTitle(request.title);

    const prefix = await this.getNotePrefix(request.parentPath);
    const note = new NoteSummary({
      notePath: joinPath(request.parentPath, `${prefix}_${request.title.trim()}.md`),
      noteFolder: request.parentPath,
      createdAt: new Date().toISOString(),
      dailynote: this.buildTodayDailyNoteLink(),
      taskKey: normalizeOptionalText(request.taskKey),
      goal: normalizeOptionalText(request.goal),
    });

    if (this.repository.exists(note.notePath)) {
      throw new Error(`Project note already exists: ${note.notePath}`);
    }

    const markdown = this.projectNoteBuilder.build(
      note,
      config.settings.note.templateText,
    );

    await this.repository.createNote(note, markdown);

    logger.debug(`[UseCase:end] NoteCreationUseCase.createProjectNote path=${note.notePath}`);

    return note;
  }

  private async getFolderPrefix(parentPath: string): Promise<string> {
    const names = await this.repository.listChildFolderNames(parentPath);

    return this.prefixService.getNextPrefix(
      names,
      config.settings.note.folderPrefix,
      config.settings.note.prefixDigits,
    );
  }

  private async getNotePrefix(projectFolderPath: string): Promise<string> {
    const names = await this.repository.listChildNoteNames(projectFolderPath);

    return this.prefixService.getNextPrefix(
      names,
      config.settings.note.notePrefix,
      config.settings.note.prefixDigits,
    );
  }

  private buildTodayDailyNoteLink(): string {
    const today = this.todayResolver.resolve();
    const notePath = this.runtime.resolveNoteUri(today).replace(/\.md$/i, "");

    return `[[${notePath}|${today}]]`;
  }

  private assertProjectRootPath(path: string): void {
    if (!ProjectFolder.isProjectRootPath(path)) {
      throw new Error(`Project root required: ${path}`);
    }
  }

  private assertProjectFolderPath(path: string): void {
    if (!ProjectFolder.isProjectFolderPath(path)) {
      throw new Error(`Project folder required: ${path}`);
    }
  }

  private assertValidTitle(title: string): void {
    const trimmed = title.trim();

    if (!trimmed) {
      throw new Error("Title is required");
    }

    if (/[\\/#%&{}<>*? $!':@+`|="]/.test(trimmed)) {
      throw new Error(`Invalid note title: ${title}`);
    }
  }
}

function joinPath(parentPath: string, name: string): string {
  return `${parentPath.replace(/[\\/]+$/, "")}/${name}`.replace(/\\/g, "/");
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
}
