import { HeadingService } from "../../domain/heading/HeadingService";

const plannedHeading = HeadingService.resolve("daily.section.planned.title");

export function isInsidePlannedSection(
  lines: string[],
  lineNumber: number,
): boolean {
  for (let i = lineNumber; i >= 0; i--) {
    const line = lines[i]?.trim() ?? "";

    if (!line.startsWith("#")) {
      continue;
    }

    const headingText = line.replace(/^#{1,6}\s+/, "").trim();

    return headingText === plannedHeading.baseTitle
      || headingText === plannedHeading.renderedTitle
      || headingText.endsWith(` ${plannedHeading.baseTitle}`);
  }

  return false;
}
