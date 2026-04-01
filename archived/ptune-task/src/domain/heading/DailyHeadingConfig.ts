import { HeadingDepth } from "md-ast-core";
import { DailyHeadingKey } from "./DailyHeadingKeys";

export type HeadingMeta = {
  depth: HeadingDepth;
  icon: string;
};

export const DailyHeadingConfig: Record<DailyHeadingKey, HeadingMeta> = {
  "daily.section.planned.title": { depth: 2, icon: "✅", },
  "daily.section.timelog.title": { depth: 2, icon: "🕒", },
  "daily.section.review.title": { depth: 3, icon: "🔁", },
  "daily.section.timetable.title": { depth: 4, icon: "🕒", },
  "daily.section.unfinished.title": { depth: 4, icon: "📦", },
  "daily.section.timeanalysis.title": { depth: 4, icon: "⏱", },
  "daily.section.memo.title": { depth: 2, icon: "🙌", },
  "daily.section.tags.title": { depth: 3, icon: "📌", },
  "daily.section.unregistered.title": { depth: 3, icon: "⚠", },
  "daily.section.report.title": { depth: 3, icon: "🏷", },
  "daily.section.reviewpoint.title": { depth: 3, icon: "🧠", },
};
