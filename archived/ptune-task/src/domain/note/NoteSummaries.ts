import { NoteProjectFolder } from "./NoteProjectFolder";
import { NoteSummary } from "./NoteSummary";

export class NoteSummaries {
  private readonly folders = new Map<string, NoteProjectFolder>();

  add(summary: NoteSummary): void {
    const folder = this.getOrCreateFolder(summary.noteFolder);
    folder.add(summary);
  }

  getAll(): NoteSummary[] {
    return [...this.folders.values()].flatMap((folder) => folder.getNotes());
  }

  getFolders(): NoteProjectFolder[] {
    return [...this.folders.values()];
  }

  private getOrCreateFolder(folderPath: string): NoteProjectFolder {
    const current = this.folders.get(folderPath);

    if (current) {
      return current;
    }

    const created = new NoteProjectFolder(folderPath);
    this.folders.set(folderPath, created);

    return created;
  }
}
