// src/features/daily_review/services/note_summary/builders/OutlinerReportBuilder.ts

import { i18n } from 'src/i18n';
import { NoteSummaryDocument } from '../../../domain/models/NoteSummaryDocument';
import { ReportBuilder } from '../../../domain/ports/ReportBuilder';
import { MarkdownCommentBlock } from 'src/core/utils/markdown/MarkdownCommentBlock';

export class OutlinerReportBuilder implements ReportBuilder {
  build(doc: NoteSummaryDocument): string {
    const lines: string[] = [];
    const comment = i18n.ui.noteAnalysis.kpt.outliner.comment;
    lines.push(MarkdownCommentBlock.build([comment.title, comment.body]));

    for (const project of doc.projects) {
      lines.push(`- ${project.projectTitle}`);

      for (const note of project.notes) {
        lines.push(`  - ${note.noteTitle}`);
        for (const s of note.sentences) {
          lines.push(`    - ${s.text}`);
        }
      }
    }

    return lines.join('\n');
  }
}
