import { NoteProjectFolder } from "../../../domain/note/NoteProjectFolder";
import { NoteSummaries } from "../../../domain/note/NoteSummaries";
import { resolveNoteSummarySentences } from "../../../domain/note/resolveNoteSummarySentences";

export type DailyNotesReportBuildOptions = {
  includeSummaries?: boolean;
};

export class DailyNotesReportBuilder {
  build(
    summaries: NoteSummaries,
    options?: DailyNotesReportBuildOptions,
  ): string {
    return this.buildOutliner(summaries, options);
  }

  private buildOutliner(
    summaries: NoteSummaries,
    options?: DailyNotesReportBuildOptions,
  ): string {
    const lines: string[] = [];
    const includeSummaries = options?.includeSummaries ?? true;

    for (const folder of summaries.getFolders()) {
      lines.push(`- ${folderTitle(folder)}`);

      for (const note of folder.getNotes()) {
        lines.push(`  - [${escapeLinkLabel(note.noteTitle)}](${encodeLinkDestination(note.notePath)})`);
        if (includeSummaries) {
          const mergedSummary = formatMergedSummary(note);
          if (mergedSummary) {
            lines.push(`    - ${mergedSummary}`);
          }
        }
      }

      lines.push("");
    }

    return lines.join("\n").trim();
  }
}

function folderTitle(folder: NoteProjectFolder): string {
  const last = folder.folderPath.split("/").pop() ?? folder.folderPath;
  return last.replace(/^[^_]+_/, "");
}

function formatMergedSummary(note: { summary?: string | null; summarySentences?: readonly string[] | null }): string | null {
  const sentences = resolveNoteSummarySentences(note);
  return sentences.length > 0 ? sentences.join(" ") : null;
}

function escapeLinkLabel(value: string): string {
  return value.replace(/[[\]]/g, "\\$&");
}

function encodeLinkDestination(value: string): string {
  return value
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}
