// src/features/daily_review/services/note_summary/NoteSummaryDocumentBuilder.ts

import { App } from 'obsidian';
import { NoteSummaries } from 'src/core/models/notes/NoteSummaries';
import { NoteSummary } from 'src/core/models/notes/NoteSummary';
import { NoteSummaryMarkdownBuilder } from 'src/core/services/notes/NoteSummaryMarkdownBuilder';
import {
  NoteNode,
  NoteSummaryDocument,
  ProjectNode,
  Sentence,
} from '../../domain/models/NoteSummaryDocument';

export class NoteSummaryDocumentBuilder {
  /**
   * Daily Review 用ドキュメント構築
   * - 表示用 title は数値プレフィックス除去
   */
  static async build(
    app: App,
    summaries: NoteSummaries,
  ): Promise<NoteSummaryDocument> {
    const projects: ProjectNode[] = [];

    for (const folder of summaries.getFoldersSorted()) {
      const notes: NoteNode[] = [];

      const projectTitle = await folder.getProjectTitle(app);

      for (const note of folder.getNotes()) {
        const sentences = this.extractSentences(note);

        const noteTitle = note.getNoteTitle();

        const notePathNoExt = note.notePath.replace(/\.md$/, '');

        notes.push({
          notePath: note.notePath,
          noteTitle,
          noteLink: `[[${notePathNoExt}|${noteTitle}]]`,
          sentences,
        });
      }

      projects.push({
        projectPath: folder.noteFolder,
        projectTitle,
        notes,
      });
    }

    return { projects };
  }

  /**
   * NoteSummaryMarkdownBuilder のセンテンス分割ロジックを再利用
   */
  private static extractSentences(note: NoteSummary): Sentence[] {
    const lines = NoteSummaryMarkdownBuilder.renderSummary(note, {
      checklist: false,
      sentenceSplit: true,
      bullet: false,
    });

    return lines.map((line) => ({ text: line }));
  }
}
