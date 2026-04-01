import { NoteSummaries } from "../../../domain/note/NoteSummaries";
import { resolveNoteSummarySentences } from "../../../domain/note/resolveNoteSummarySentences";
import { DailyNotesReflectionDocument, ReflectionProject, ReflectionSentence } from "../models/DailyNotesReflectionDocument";

export class DailyNotesReflectionDocumentBuilder {
  build(summaries: NoteSummaries): DailyNotesReflectionDocument {
    const projects: ReflectionProject[] = summaries.getFolders().map((folder) => ({
      projectTitle: this.resolveProjectTitle(folder.folderPath),
      notes: folder.getNotes().map((note) => ({
        noteTitle: note.noteTitle,
        sentences: this.buildSentences(note),
      })),
    }));

    return new DailyNotesReflectionDocument(projects);
  }

  private buildSentences(note: { summary?: string | null; summarySentences?: readonly string[] | null }): ReflectionSentence[] {
    const sentences = resolveNoteSummarySentences(note);

    if (sentences.length === 0) {
      return [{ text: "(summary missing)" }];
    }

    return sentences.map((line) => ({ text: line }));
  }

  private resolveProjectTitle(folderPath: string): string {
    const last = folderPath.split("/").pop() ?? folderPath;
    return last.replace(/^[^_]+_/, "");
  }
}
