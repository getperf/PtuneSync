import { App, FileSystemAdapter, normalizePath } from "obsidian";

export class PtuneSyncWorkDir {
  constructor(private readonly app: App) {}

  getRootRelative(): string {
    const workDir = this.getWorkDirPath();

    if (!this.isAbsolutePath(workDir)) {
      return workDir;
    }

    const basePath = this.getBasePath();
    const normalizedBase = normalizePath(basePath);

    if (workDir === normalizedBase) {
      return ".";
    }

    const prefix = `${normalizedBase}/`;
    if (workDir.startsWith(prefix)) {
      return workDir.slice(prefix.length);
    }

    return workDir;
  }

  getRootAbsolute(): string {
    const workDir = this.getWorkDirPath();
    if (this.isAbsolutePath(workDir)) {
      return workDir;
    }

    return normalizePath(`${this.getBasePath()}/${workDir}`);
  }

  getStatusFile(): string {
    return normalizePath(`${this.getRootRelative()}/status.json`);
  }

  getStatusFileAbsolute(): string {
    return normalizePath(`${this.getRootAbsolute()}/status.json`);
  }

  getEventsLogFile(): string {
    return normalizePath(`${this.getRootRelative()}/events.log`);
  }

  getEventsLogFileAbsolute(): string {
    return normalizePath(`${this.getRootAbsolute()}/events.log`);
  }

  getDiffInputFile(): string {
    return normalizePath(`${this.getRootRelative()}/diff-input.json`);
  }

  getDiffInputFileAbsolute(): string {
    return normalizePath(`${this.getRootAbsolute()}/diff-input.json`);
  }

  getPushInputFile(): string {
    return normalizePath(`${this.getRootRelative()}/push-input.json`);
  }

  getPushInputFileAbsolute(): string {
    return normalizePath(`${this.getRootAbsolute()}/push-input.json`);
  }

  async ensureExists(): Promise<void> {
    if (!(await this.app.vault.adapter.exists(this.getRootRelative()))) {
      await this.app.vault.adapter.mkdir(this.getRootRelative());
    }
  }

  private getWorkDirPath(): string {
    return normalizePath(`${this.app.vault.configDir}/plugins/ptune-task/work`);
  }

  private getBasePath(): string {
    const adapter = this.app.vault.adapter;

    if (!(adapter instanceof FileSystemAdapter)) {
      throw new Error("Ptune sync URI is only supported on desktop");
    }

    return adapter.getBasePath();
  }

  private isAbsolutePath(path: string): boolean {
    return /^[A-Za-z]:[\\/]/.test(path) || path.startsWith("//") || path.startsWith("/");
  }
}
