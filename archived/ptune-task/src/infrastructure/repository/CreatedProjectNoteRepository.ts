import { App, TFile } from "obsidian";
import { MarkdownFile } from "md-ast-core";
import { ProjectFolder } from "../../domain/project/ProjectFolder";
import { logger } from "../../shared/logger/loggerInstance";

export class CreatedProjectNoteRepository {
  constructor(private readonly app: App) {}

  findByDate(date: string): TFile[] {
    const threshold = this.buildLooseThreshold(date);
    const candidates = this.app.vault.getMarkdownFiles().filter((file) => {
      if (!file.path.startsWith(`${ProjectFolder.rootDir}/`)) {
        return false;
      }

      if (file.basename === "index") {
        return false;
      }

      return file.stat.ctime >= threshold;
    });

    logger.debug(
      `[Repository] CreatedProjectNoteRepository.findByDate prefilter date=${date} candidates=${candidates.length}`,
    );

    const matched = candidates.filter((file) => {
      const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
      const dailynote = typeof frontmatter?.dailynote === "string"
        ? frontmatter.dailynote
        : null;

      if (!dailynote) {
        return false;
      }

      return this.extractDateKeyFromDailyNote(dailynote) === date;
    });

    logger.debug(
      `[Repository] CreatedProjectNoteRepository.findByDate matched date=${date} count=${matched.length}`,
    );

    return matched;
  }

  async hasSummary(file: TFile): Promise<boolean> {
    const text = await this.app.vault.read(file);
    const summary = MarkdownFile.parse(text).getFrontmatter().get("summary");

    if (typeof summary === "string") {
      return summary.trim().length > 0;
    }

    if (Array.isArray(summary)) {
      return summary.some((line) => typeof line === "string" && line.trim().length > 0);
    }

    return false;
  }

  private buildLooseThreshold(date: string): number {
    const target = new Date(`${date}T00:00:00`);
    target.setDate(target.getDate() - 1);
    return target.getTime();
  }

  private extractDateKeyFromDailyNote(value: string): string | null {
    const match = value.match(/\d{4}-\d{2}-\d{2}/);
    return match?.[0] ?? null;
  }
}
