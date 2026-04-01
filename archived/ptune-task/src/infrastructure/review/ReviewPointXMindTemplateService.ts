import { App, normalizePath } from "obsidian";
import { DailyNote } from "../../domain/daily/DailyNote";
import { logger } from "../../shared/logger/loggerInstance";

export type ReviewPointXMindTemplate = {
  vaultPath: string;
  markdownLinkPath: string;
  created: boolean;
};

export class ReviewPointXMindTemplateService {
  private static readonly PLUGIN_ID = "ptune-task";
  private static readonly TEMPLATE_PATH = "assets/template_analysis.xmind";

  constructor(private readonly app: App) {}

  async ensureForDailyNote(note: DailyNote): Promise<ReviewPointXMindTemplate> {
    const targetPath = normalizePath(
      `${this.resolveParentDir(note.filePath)}/${note.date}_reviewpoint.xmind`,
    );
    const exists = await this.app.vault.adapter.exists(targetPath);

    if (!exists) {
      const sourcePath = this.getTemplateSourcePath();
      logger.debug(
        `[Service] ReviewPointXMindTemplateService.copy start source=${sourcePath} target=${targetPath}`,
      );
      const data = await this.app.vault.adapter.readBinary(sourcePath);
      await this.app.vault.adapter.writeBinary(targetPath, data);
      logger.debug(
        `[Service] ReviewPointXMindTemplateService.copy end target=${targetPath}`,
      );
    }

    return {
      vaultPath: targetPath,
      markdownLinkPath: encodeLinkDestination(targetPath),
      created: !exists,
    };
  }

  private getTemplateSourcePath(): string {
    return normalizePath(
      `${this.app.vault.configDir}/plugins/${ReviewPointXMindTemplateService.PLUGIN_ID}/${ReviewPointXMindTemplateService.TEMPLATE_PATH}`,
    );
  }

  private resolveParentDir(path: string): string {
    const index = path.lastIndexOf("/");
    return index >= 0 ? path.slice(0, index) : "";
  }
}

function encodeLinkDestination(value: string): string {
  return value
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}
