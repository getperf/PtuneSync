import { MarkdownFile } from "md-ast-core";
import { ProjectFolder } from "../../../domain/project/ProjectFolder";

export class ProjectIndexBuilder {
  build(folder: ProjectFolder, createdAt: string): string {
    const md = MarkdownFile.createEmpty();
    const frontmatter = md.getFrontmatter();

    frontmatter.set("created", createdAt);
    frontmatter.set("updated", createdAt);

    if (folder.taskKey) {
      frontmatter.set("taskKey", folder.taskKey);
    }

    if (folder.dailynote) {
      frontmatter.set("dailynote", folder.dailynote);
    }

    md.root().appendChild({
      title: folder.title,
      depth: 1,
      content: () => "",
    });

    return md.toString();
  }
}
