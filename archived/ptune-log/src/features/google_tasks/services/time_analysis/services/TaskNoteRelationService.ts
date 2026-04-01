// File: src/features/google_tasks/services/time_analysis/services/TaskNoteRelationService.ts

import { App, TFile } from 'obsidian';
import { NoteSearchService } from 'src/core/services/notes/NoteSearchService';
import { NoteFrontmatterParser } from 'src/core/utils/frontmatter/NoteFrontmatterParser';
import { TimeReport } from '../models/TimeReport';
import { RelatedNote } from '../models/RelatedNote';
import { logger } from 'src/core/services/logger/loggerInstance';

export class TaskNoteRelationService {
  private readonly noteSearch: NoteSearchService;

  constructor(private readonly app: App) {
    this.noteSearch = new NoteSearchService(app);
  }

  /**
   * TimeReport に relatedNotes を付加する（破壊的更新）
   * - 当日のノートを findByDate(date) で取得
   * - frontmatter.taskKey の完全一致のみ
   */
  async attachRelatedNotes(report: TimeReport, date: Date): Promise<void> {
    const notes = await this.noteSearch.findByDate(date);
    if (notes.length === 0) {
      logger.debug('[TaskNoteRelationService] no notes for date');
      return;
    }

    // taskKey -> RelatedNote[] のインデックス
    const index = await this.buildIndex(notes);

    // タスク主導で付加
    for (const [taskKey, entry] of report.tasks.entries()) {
      const related = index.get(taskKey);
      if (related && related.length > 0) {
        entry.relatedNotes = related;
      }
    }
  }

  /** ノート一覧から taskKey -> RelatedNote[] を構築 */
  private async buildIndex(
    files: TFile[]
  ): Promise<Map<string, RelatedNote[]>> {
    const map = new Map<string, RelatedNote[]>();

    for (const file of files) {
      const fm = await NoteFrontmatterParser.parseFromFile(this.app, file);

      const taskKey = fm.taskKey;
      if (typeof taskKey !== 'string' || taskKey.trim() === '') {
        continue; // taskKey 未定義は無視
      }

      const related: RelatedNote = {
        path: this.toNotePath(file.path),
        tags: Array.isArray(fm.tags) ? fm.tags : [],
      };

      const list = map.get(taskKey) ?? [];
      list.push(related);
      map.set(taskKey, list);
    }

    logger.debug(`[TaskNoteRelationService] indexed ${map.size} taskKeys`);
    return map;
  }

  /** foo/bar/baz.md -> foo/bar/baz */
  private toNotePath(path: string): string {
    return path.replace(/\.md$/i, '');
  }
}
