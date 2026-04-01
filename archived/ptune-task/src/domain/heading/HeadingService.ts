import { HeadingDepth } from "md-ast-core";
import { DailyHeadingKey } from "./DailyHeadingKeys";
import { DailyHeadingConfig } from "./DailyHeadingConfig";
import { i18n } from "../../shared/i18n/I18n";

export type ResolvedHeading = {
  baseTitle: string;
  renderedTitle: string;
  depth: HeadingDepth;
};

export class HeadingService {
  static resolve(key: DailyHeadingKey): ResolvedHeading {
    // DailyHeadingKey values always have at least three segments, so the
    // third element is guaranteed to exist.  TypeScript still infers
    // `string | undefined` for the array access, so use the non-null
    // assertion to satisfy the compiler.
    const sectionName = key.split(".")[2]!;
    const sectionDict = (i18n.common.daily.section as Record<string, { title: string }>)[sectionName];
    const baseTitle = sectionDict?.title ?? sectionName;
    const meta = DailyHeadingConfig[key];

    return {
      baseTitle,
      renderedTitle: `${meta.icon} ${baseTitle}`,
      depth: meta.depth,
    };
  }
}
