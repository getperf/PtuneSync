import { DailyNote } from "../../../domain/daily/DailyNote";
import { DailyNoteDocumentAdapter } from "../adapter/DailyNoteDocumentAdapter";
import { HeadingMatcher } from "../matcher/HeadingMatcher";
import { HeadingService } from "../../../domain/heading/HeadingService";
import { logger } from "../../../shared/logger/loggerInstance";

export class DailyNotesReviewWriter {
  write(note: DailyNote, report: string, reflection: string): DailyNote {
    logger.debug(`[Service] DailyNotesReviewWriter.write start path=${note.filePath}`);
    const adapter = new DailyNoteDocumentAdapter(note.content);
    const memoSection = adapter.findOrCreateSection("daily.section.memo.title");
    logger.debug("[Service] DailyNotesReviewWriter.write memoSectionReady");

    this.upsertChildSection(
      adapter,
      memoSection,
      "daily.section.report.title",
      report,
    );
    if (reflection.trim()) {
      this.upsertChildSection(
        adapter,
        memoSection,
        "daily.section.reviewpoint.title",
        reflection,
      );
    } else {
      this.removeChildSection(
        adapter,
        "daily.section.reviewpoint.title",
      );
    }

    logger.debug(`[Service] DailyNotesReviewWriter.write end path=${note.filePath}`);
    return note.withContent(adapter.toString());
  }

  private upsertChildSection(
    adapter: DailyNoteDocumentAdapter,
    parentSection: ReturnType<DailyNoteDocumentAdapter["findOrCreateSection"]>,
    key: "daily.section.report.title" | "daily.section.reviewpoint.title",
    markdownBody: string,
  ): void {
    const heading = HeadingService.resolve(key);
    const matcher = HeadingMatcher.heading(heading.baseTitle);
    let target = adapter.findSectionByMatcher(matcher);

    logger.debug(`[Service] DailyNotesReviewWriter.upsertChildSection start key=${key} exists=${target !== null}`);

    if (!target) {
      parentSection.appendChild({
        title: heading.renderedTitle,
        depth: heading.depth,
        content: () => "",
      });
      target = adapter.findSectionByMatcher(matcher);
      logger.debug(`[Service] DailyNotesReviewWriter.upsertChildSection appended key=${key} foundAfterAppend=${target !== null}`);
    }

    if (!target) {
      logger.warn(`[Service] DailyNotesReviewWriter.upsertChildSection targetMissing key=${key}`);
      throw new Error(`Failed to create daily review section: ${key}`);
    }

    target.resetContent(markdownBody);
    logger.debug(`[Service] DailyNotesReviewWriter.upsertChildSection updated key=${key} length=${markdownBody.trim().length}`);
  }

  private removeChildSection(
    adapter: DailyNoteDocumentAdapter,
    key: "daily.section.reviewpoint.title",
  ): void {
    const heading = HeadingService.resolve(key);
    const removed = adapter.removeSectionByMatcher(
      HeadingMatcher.heading(heading.baseTitle),
    );
    logger.debug(`[Service] DailyNotesReviewWriter.removeChildSection key=${key} removed=${removed}`);
  }
}
