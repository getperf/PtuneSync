import { App } from "obsidian";
import { PtuneSyncWorkDir } from "./PtuneSyncWorkDir";

export class PtuneSyncInputFileWriter {
  constructor(
    private readonly app: App,
    private readonly workDir: PtuneSyncWorkDir,
  ) {}

  async writeDiffInput(payload: string): Promise<string> {
    await this.app.vault.adapter.write(this.workDir.getDiffInputFile(), payload);
    return this.workDir.getDiffInputFileAbsolute();
  }

  async writePushInput(payload: string): Promise<string> {
    await this.app.vault.adapter.write(this.workDir.getPushInputFile(), payload);
    return this.workDir.getPushInputFileAbsolute();
  }
}
