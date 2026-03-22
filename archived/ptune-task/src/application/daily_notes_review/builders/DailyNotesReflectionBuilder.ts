import { DailyNotesReflectionDocument } from "../models/DailyNotesReflectionDocument";
import { ReviewOutputFormat } from "../../../config/types";
import { i18n } from "../../../shared/i18n/I18n";

export type DailyNotesReflectionBuildOptions = {
  xmindFileLink?: string;
};

export class DailyNotesReflectionBuilder {
  build(
    doc: DailyNotesReflectionDocument,
    outputFormat: ReviewOutputFormat,
    options?: DailyNotesReflectionBuildOptions,
  ): string {
    if (outputFormat === "xmind") {
      return this.buildXmind(doc, options);
    }

    return this.buildOutline(doc);
  }

  private buildOutline(doc: DailyNotesReflectionDocument): string {
    const lines = [
      buildCommentBlock(i18n.common.daily.reviewpoint.comment.outline),
      "",
      ...this.buildOutlineLines(doc),
    ];

    return lines.join("\n").trim();
  }

  private buildXmind(
    doc: DailyNotesReflectionDocument,
    options?: DailyNotesReflectionBuildOptions,
  ): string {
    const t = i18n.common.daily.reviewpoint;
    const lines = [
      buildCommentBlock(t.comment.xmind),
      "",
    ];

    if (options?.xmindFileLink) {
      lines.push(`[${t.xmindFileLinkLabel}](${options.xmindFileLink})`, "");
    }

    lines.push(
      `**${t.xmindInputHeading}**`,
      "",
      wrapWithCodeBlock(this.buildXmindInput(doc), "text"),
      "",
      `**${t.xmindOutputHeading}**`,
      "",
      wrapWithCodeBlock("", "text"),
    );

    return lines.join("\n").trim();
  }

  private buildOutlineLines(doc: DailyNotesReflectionDocument): string[] {
    const lines: string[] = [];

    for (const project of doc.projects) {
      lines.push(`- ${project.projectTitle}`);

      for (const note of project.notes) {
        lines.push(`  - ${note.noteTitle}`);

        for (const sentence of note.sentences) {
          lines.push(`    - ${sentence.text}`);
        }
      }
    }

    return lines;
  }

  private buildXmindInput(doc: DailyNotesReflectionDocument): string {
    const lines: string[] = [];

    for (const project of doc.projects) {
      lines.push(project.projectTitle);

      for (const note of project.notes) {
        lines.push(`\t${note.noteTitle}`);

        for (const sentence of note.sentences) {
          lines.push(`\t\t${sentence.text}`);
        }
      }
    }

    return lines.join("\n");
  }
}

function buildCommentBlock(lines: readonly string[]): string {
  return ["<!--", ...lines, "-->"].join("\n");
}

function wrapWithCodeBlock(content: string, language: string): string {
  return `\`\`\`${language}\n${content}\n\`\`\``;
}
