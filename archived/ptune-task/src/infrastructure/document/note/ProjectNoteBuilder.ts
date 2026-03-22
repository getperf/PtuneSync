import { MarkdownFile } from "md-ast-core";
import { NoteSummary } from "../../../domain/note/NoteSummary";

export class ProjectNoteBuilder {
  build(note: NoteSummary, templateText: string): string {
    const renderedTemplate = templateText.replace(/{{title}}/g, note.noteTitle);
    const md = renderedTemplate.trim()
      ? MarkdownFile.parse(renderedTemplate)
      : MarkdownFile.createEmpty();
    const frontmatter = md.getFrontmatter();

    frontmatter.set("createdAt", note.createdAt);

    if (note.dailynote) {
      frontmatter.set("dailynote", note.dailynote);
    }

    if (note.taskKey) {
      frontmatter.set("taskKey", note.taskKey);
    }

    if (note.goal) {
      frontmatter.set("goal", note.goal);
    }

    return md.toString();
  }
}
