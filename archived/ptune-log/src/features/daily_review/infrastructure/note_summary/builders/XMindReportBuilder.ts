// src/features/daily_review/services/note_summary/builders/XMindReportBuilder.ts

import { wrapWithCodeBlock } from 'src/core/utils/markdown/CodeBlockUtil';
import { MarkdownCommentBlock } from 'src/core/utils/markdown/MarkdownCommentBlock';
import { NoteSummaryDocument } from '../../../domain/models/NoteSummaryDocument';
import { ReportBuilder } from '../../../domain/ports/ReportBuilder';
import { getText } from '../../../i18n/comment';

export class XMindReportBuilder implements ReportBuilder {
  build(doc: NoteSummaryDocument): string {
    const blocks: string[] = [];

    // --- 利用手順コメント（HTML コメント） ---
    const header = MarkdownCommentBlock.build(
      getText('review-point-action-comment'),
    );
    blocks.push(header);

    // --- インプット見出し ---
    blocks.push(`#### ${getText('xmind-input-heading')}`);

    // --- XMind コピー用テキスト生成 ---
    const inputText = this.buildInputText(doc);
    blocks.push(wrapWithCodeBlock(inputText, 'text'));

    // --- アウトプット見出し（空） ---
    blocks.push(`#### ${getText('xmind-output-heading')}`);
    blocks.push(wrapWithCodeBlock('', 'text'));

    return blocks.join('\n\n');
  }

  private buildInputText(doc: NoteSummaryDocument): string {
    const lines: string[] = [];
    for (const project of doc.projects) {
      lines.push(project.projectTitle);

      for (const note of project.notes) {
        lines.push(`\t${note.noteTitle}`);
        for (const s of note.sentences) {
          lines.push(`\t\t${s.text}`);
        }
      }
    }

    return lines.join('\n');
  }
}
