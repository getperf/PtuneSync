import { App } from "obsidian";
import { getDailyNoteSettings } from "obsidian-daily-notes-interface";
import { DailyNotePathResolver } from "../repository/DailyNotePathResolver";

/**
 * Obsidian-specific context and operations.
 *
 * Encapsulates Obsidian App reference and Obsidian-specific behaviors:
 * - Path resolution (journal folder, note URI)
 * - Vault operations
 *
 * Separated from runtime to isolate Obsidian API dependencies and allow
 * alternative implementations (e.g., for testing).
 */
export class ObsidianContext {
  constructor(readonly app: App) { }

  /**
   * Resolve journal folder from Obsidian daily-notes plugin settings.
   * Returns vault-relative path or empty string if not configured.
   */
  resolveJournalDir(): string {
    return getDailyNoteSettings().folder?.trim() || "";
  }

  /**
   * Resolve note URI using the Daily Notes plugin format.
   */
  resolveNoteUri(date: string): string {
    return this.getPathResolver().resolve(date);
  }

  parseDailyNoteDate(path: string): string | null {
    return this.getPathResolver().parse(path);
  }

  private getPathResolver(): DailyNotePathResolver {
    const settings = getDailyNoteSettings();

    return new DailyNotePathResolver(
      settings.folder?.trim() || "",
      settings.format?.trim() || "YYYY-MM-DD",
    );
  }
}
