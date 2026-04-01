import { config } from "../config/config";
import { DailyNoteRepository } from "../infrastructure/repository/DailyNoteRepository";
import { ObsidianContext } from "../infrastructure/obsidian/ObsidianContext";

export interface HabitTasks {
  morning: string[];
  evening: string[];
}

/**
 * Central runtime container for use cases.
 *
 * Holds infrastructure layer (repositories, config, context) and exposes
 * a single entry point for all use cases. Reduces container bloat by
 * centralizing DI.
 *
 * Role:
 *   - DailyNoteRepository (I/O adapter)
 *   - ObsidianContext (Obsidian-specific operations)
 *   - Configuration access
 *
 * Does NOT contain:
 *   - Business logic services (HabitService, TaskTreeBuilder, etc.)
 *   - Formatters or parsers (instantiated inline as needed)
 */
export class PtuneRuntime {
  readonly dailyNoteRepository: DailyNoteRepository;

  constructor(private readonly obsidianContext: ObsidianContext) {
    this.dailyNoteRepository = new DailyNoteRepository(this, obsidianContext.app);
  }

  /**
 * Get Obsidian-specific context (vault, app, path resolution).
   * Used internally by infrastructure adapters.
   */
  getObsidianContext(): ObsidianContext {
    return this.obsidianContext;
  }

  /** Obsidian デイリーノートプラグインのフォルダ設定を返す (vault 相対パス) */
  resolveJournalDir(): string {
    return this.obsidianContext.resolveJournalDir();
  }

  /** date に対応するノートの vault 相対パスを返す */
  resolveNoteUri(date: string): string {
    return this.obsidianContext.resolveNoteUri(date);
  }

  parseDailyNoteDate(path: string): string | null {
    return this.obsidianContext.parseDailyNoteDate(path);
  }

  getHabitTasks(): HabitTasks {
    const dailyNoteHabit = config.settings.dailyNoteTask?.habit;

    return {
      morning: dailyNoteHabit?.morning
        ?? config.settings.habitTasks?.morning
        ?? [],
      evening: dailyNoteHabit?.evening
        ?? config.settings.habitTasks?.evening
        ?? [],
    };
  }
}
