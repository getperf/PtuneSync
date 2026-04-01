import { ReviewTaskTree } from "../models/ReviewTaskTree";

export class TimeAnalysisBuilder {
  build(tree: ReviewTaskTree): string {
    const byTag = tree.aggregatePomodoroByTag();

    if (byTag.size === 0) {
      return `- (time analysis: no tags)`;
    }

    const lines: string[] = [];
    lines.push(`- (time analysis by tag)`);

    const tags = Array.from(byTag.keys()).sort((a, b) => a.localeCompare(b));

    for (const tag of tags) {
      const { planned, actual } = byTag.get(tag)!;

      const plannedDisplay = planned === 0 ? "-" : planned.toString();
      const actualDisplay =
        actual === 0 ? "0.0" : (Math.round(actual * 10) / 10).toFixed(1);

      lines.push(`  - ${tag}: 🍅${plannedDisplay}/${actualDisplay}`);
    }

    return lines.join("\n").trim();
  }
}
