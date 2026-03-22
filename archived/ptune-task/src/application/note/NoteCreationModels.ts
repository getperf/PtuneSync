export type NoteCreationKind = "project-folder" | "project-note";

export interface NoteCreationRequest {
  parentPath: string;
  title: string;
  taskKey?: string;
  goal?: string;
}
