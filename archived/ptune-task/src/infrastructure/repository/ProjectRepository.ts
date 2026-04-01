import { App, TFile, TFolder, normalizePath } from "obsidian";
import { NoteSummary } from "../../domain/note/NoteSummary";
import { ProjectFolder } from "../../domain/project/ProjectFolder";
import { PtuneRuntime } from "../../shared/PtuneRuntime";
import { logger } from "../../shared/logger/loggerInstance";

export class ProjectRepository {
  constructor(
    private readonly _runtime: PtuneRuntime,
    private readonly app: App,
  ) {}

  getFolder(path: string): TFolder | null {
    const folder = this.app.vault.getAbstractFileByPath(normalizePath(path));

    return folder instanceof TFolder ? folder : null;
  }

  exists(path: string): boolean {
    return this.app.vault.getAbstractFileByPath(normalizePath(path)) !== null;
  }

  async listChildFolderNames(parentPath: string): Promise<string[]> {
    const folder = this.getFolder(parentPath);

    if (!folder) {
      return [];
    }

    return folder.children
      .filter((child): child is TFolder => child instanceof TFolder)
      .map((child) => child.name);
  }

  async listChildNoteNames(parentPath: string): Promise<string[]> {
    const folder = this.getFolder(parentPath);

    if (!folder) {
      return [];
    }

    return folder.children
      .filter((child): child is TFile => child instanceof TFile)
      .map((child) => child.name);
  }

  async createProjectFolder(
    folder: ProjectFolder,
    indexContent: string,
  ): Promise<void> {
    logger.debug(`[Repository] ProjectRepository.createProjectFolder start path=${folder.path}`);

    await this.app.vault.createFolder(normalizePath(folder.path));
    await this.app.vault.create(normalizePath(folder.indexNotePath), indexContent);

    logger.info(`[Repository] ProjectRepository.createProjectFolder created path=${folder.path}`);
  }

  async createNote(
    note: NoteSummary,
    markdown: string,
  ): Promise<void> {
    logger.debug(`[Repository] ProjectRepository.createNote start path=${note.notePath}`);

    await this.app.vault.create(normalizePath(note.notePath), markdown);

    logger.info(`[Repository] ProjectRepository.createNote created path=${note.notePath}`);
  }
}
