import { NoteSummary } from "./NoteSummary";

export class NoteProjectFolder {
  private readonly notes: NoteSummary[] = [];

  constructor(readonly folderPath: string) {}

  get indexNotePath(): string {
    return `${this.folderPath}/index.md`;
  }

  add(note: NoteSummary): void {
    this.notes.push(note);
  }

  getNotes(): NoteSummary[] {
    return [...this.notes];
  }
}
