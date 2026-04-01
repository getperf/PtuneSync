// File: src/features/daily_review/services/DailyReviewApplier.ts

import { App } from 'obsidian';
import { NoteSummaries } from 'src/core/models/notes/NoteSummaries';
import { DailyNote } from 'src/core/models/daily_notes/DailyNote';
import { DailyNoteLoader } from 'src/core/services/daily_notes/file_io/DailyNoteLoader';
import { DailyNoteWriter } from 'src/core/services/daily_notes/file_io/DailyNoteWriter';
import { DailyReviewSummaryBuilder } from '../../domain/builders/DailyReviewSummaryBuilder';
import { ReviewSettings } from 'src/config/settings/ReviewSettings';
import { MarkdownCommentBlock } from 'src/core/utils/markdown/MarkdownCommentBlock';
import { getText } from '../../i18n/comment';
import { TagAliases } from 'src/core/models/tags/TagAliases';
import { TagAliasCommitService } from 'src/core/services/tags/TagAliasCommitService';
import { logger } from 'src/core/services/logger/loggerInstance';
import { DateUtil } from 'src/core/utils/date/DateUtil';
import { DailyReviewTagListBuilder } from '../../domain/builders/DailyReviewTagListBuilder';

export class DailyReviewApplier {
  private readonly writer: DailyNoteWriter;

  constructor(
    private readonly app: App,
    private readonly settings: ReviewSettings,
  ) {
    this.writer = new DailyNoteWriter(app);
  }

  async apply(
    date: Date,
    summaries: NoteSummaries,
    reportMd?: string,
  ): Promise<void> {
    let dailyNote = await DailyNoteLoader.load(this.app, date);

    // --- ① レポートを reviewPoints セクション配下に追記 ---
    if (reportMd && reportMd.trim().length > 0) {
      dailyNote = this.appendToReviewPoints(dailyNote, reportMd);
    }

    // --- ② reviewedNote（初回のみ） ---
    dailyNote = this.applyReviewedNoteIfNeeded(dailyNote, summaries);

    // --- ③ タグ一覧 ---
    const tagListMd = DailyReviewTagListBuilder.build(summaries);
    dailyNote = dailyNote.updateReviewMemo(tagListMd);

    // --- write ---
    await this.writer.write(dailyNote, date);

    // --- ④ Alias 辞書 commit ---
    const newTags = summaries.getAllUnregisteredTags();
    if (newTags.length > 0) {
      logger.info(
        `[DailyReviewApplier] committing aliases (newTags=${newTags.length})`,
      );

      const aliases = new TagAliases();
      await aliases.load(this.app.vault);

      const commitService = new TagAliasCommitService(aliases);
      await commitService.commit(newTags, this.app.vault);
    }
  }

  private appendToReviewPoints(
    dailyNote: DailyNote,
    reportMd: string,
  ): DailyNote {
    const suffix = `(${DateUtil.localTime()})`;
    return dailyNote.appendReviewPoint(reportMd, suffix, 'first');
  }

  /** reviewedNote は初回のみ更新 */
  private applyReviewedNoteIfNeeded(
    dailyNote: DailyNote,
    summaries: NoteSummaries,
  ): DailyNote {
    if (dailyNote.reviewedNote.hasContent()) {
      return dailyNote;
    }

    const summaryMd = DailyReviewSummaryBuilder.build(summaries, this.settings);
    const parts: string[] = [summaryMd.trimEnd()];

    return dailyNote.updateReviewedNote(parts.join('\n'));
  }
}
