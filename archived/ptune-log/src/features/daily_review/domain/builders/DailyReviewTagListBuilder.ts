// File: src/features/daily_review/services/DailyReviewTagListBuilder.ts

import { NoteSummaries } from 'src/core/models/notes/NoteSummaries';
import { MarkdownCommentBlock } from 'src/core/utils/markdown/MarkdownCommentBlock';
import { i18n } from 'src/i18n';
import { getText } from '../../i18n/comment';

const HEADER_PREFIX = '### ';

export class DailyReviewTagListBuilder {
  static build(summaries: NoteSummaries): string {
    const allTags = summaries.getAllTags();
    const newTags = summaries.getAllUnregisteredTags();

    // ### 📌 タグ一覧（当日生成）
    const i18nLabel = i18n.domain.daily_note;
    const tagHeader = `${HEADER_PREFIX} 📌 ${i18nLabel['note.tags.daily']}`;
    // ### ⚠ 未登録タグ候補（要レビュー）
    const tagUnregistered = `${HEADER_PREFIX} ⚠ ${i18nLabel['note.tags.unregistered']}`;

    const lines: string[] = [
      tagHeader,
      '',
      allTags.map((t) => `#${t}`).join(' '),
    ];

    if (newTags.length > 0) {
      const comment = getText('daily-review-unregistered-guide');
      lines.push(
        '',
        tagUnregistered,
        '',
        MarkdownCommentBlock.build(comment),
        '',
        newTags.map((t) => `#${t}`).join(' '),
      );
    }

    return lines.join('\n') + '\n';
  }
}
