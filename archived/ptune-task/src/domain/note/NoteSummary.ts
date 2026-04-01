import { parseLegacySummaryText } from "./parseLegacySummaryText";

export interface NoteSummaryParams {
  notePath: string;
  createdAt: string;
  noteFolder: string;
  summary?: string | null;
  summarySentences?: string[];
  tags?: string[];
  dailynote?: string;
  taskKey?: string;
  goal?: string;
}

export class NoteSummary {
  readonly notePath: string;
  readonly createdAt: string;
  readonly noteFolder: string;
  readonly summarySentences: string[];
  readonly tags: string[];
  readonly dailynote?: string;
  readonly taskKey?: string;
  readonly goal?: string;

  constructor(params: NoteSummaryParams) {
    this.notePath = normalizePath(params.notePath);
    this.createdAt = params.createdAt;
    this.noteFolder = normalizePath(params.noteFolder);
    this.summarySentences = params.summarySentences
      ? [...params.summarySentences]
      : typeof params.summary === "string"
        ? parseLegacySummaryText(params.summary)
        : [];
    this.tags = [...(params.tags ?? [])];
    this.dailynote = params.dailynote;
    this.taskKey = params.taskKey;
    this.goal = params.goal;
  }

  get summary(): string | null {
    return this.summarySentences.length > 0
      ? this.summarySentences.join("\n")
      : null;
  }

  get noteTitle(): string {
    const fileName = this.notePath.split("/").pop() ?? this.notePath;

    return fileName.replace(/\.md$/i, "").replace(/^[^_]+_/, "");
  }
}

function normalizePath(path: string): string {
  return path
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/");
}
