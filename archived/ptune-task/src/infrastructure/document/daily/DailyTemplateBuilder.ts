import { MarkdownFile } from "md-ast-core";
import { i18n } from "../../../shared/i18n/I18n";
import { HeadingService } from "../../../domain/heading/HeadingService";
import { PlannedTaskSectionBuilder } from "../../../application/planning/builders/PlannedTaskSectionBuilder";

export interface DailyTemplateOptions {
  morningHabits: string[];
  eveningHabits: string[];
}

export class DailyTemplateBuilder {
  private static readonly SECTION_SEPARATOR = "---";

  build(
    options: DailyTemplateOptions,
  ): string {

    const md = MarkdownFile.createEmpty();

    const planned = HeadingService.resolve("daily.section.planned.title");
    const timelog = HeadingService.resolve("daily.section.timelog.title");
    const memo = HeadingService.resolve("daily.section.memo.title");

    md.root().appendChild({
      title: planned.renderedTitle,
      depth: planned.depth,
      content: () =>
        `${this.buildPlannedSection(options)}\n\n${DailyTemplateBuilder.SECTION_SEPARATOR}`,
    });

    md.root().appendChild({
      title: timelog.renderedTitle,
      depth: timelog.depth,
      content: () => DailyTemplateBuilder.SECTION_SEPARATOR,
    });

    md.root().appendChild({
      title: memo.renderedTitle,
      depth: memo.depth,
      content: () => DailyTemplateBuilder.SECTION_SEPARATOR,
    });

    return md.toString();
  }

  private buildPlannedSection(options: DailyTemplateOptions): string {
    return PlannedTaskSectionBuilder.build({
      commentLine1: i18n.common.daily.planned.comment.line1,
      commentLine2: i18n.common.daily.planned.comment.line2,
      morningHabits: options.morningHabits,
      eveningHabits: options.eveningHabits,
      keepExistingHabits: false,
    });
  }
}
