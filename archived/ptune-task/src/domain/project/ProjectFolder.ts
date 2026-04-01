const PROJECT_ROOT_DIR = "_project";

export class ProjectFolder {
  static readonly rootDir = PROJECT_ROOT_DIR;

  readonly path: string;
  readonly taskKey?: string;
  readonly dailynote?: string;

  constructor(path: string, taskKey?: string, dailynote?: string) {
    this.path = normalizePath(path);
    this.taskKey = taskKey;
    this.dailynote = dailynote;
  }

  static isProjectRootPath(path: string): boolean {
    return normalizePath(path) === PROJECT_ROOT_DIR;
  }

  static isProjectFolderPath(path: string): boolean {
    const normalized = normalizePath(path);

    if (!normalized.startsWith(`${PROJECT_ROOT_DIR}/`)) {
      return false;
    }

    return normalized.split("/").length === 2;
  }

  get name(): string {
    return this.path.split("/").pop() ?? this.path;
  }

  get prefix(): string | null {
    return splitPrefixedName(this.name).prefix;
  }

  get title(): string {
    return splitPrefixedName(this.name).title;
  }

  get indexNotePath(): string {
    return `${this.path}/index.md`;
  }
}

function splitPrefixedName(
  value: string,
): {
  prefix: string | null;
  title: string;
} {
  const match = value.match(/^([^_]+)_(.+)$/);

  if (!match) {
    return {
      prefix: null,
      title: value,
    };
  }

  return {
    prefix: match[1] ?? null,
    title: match[2] ?? value,
  };
}

function normalizePath(path: string): string {
  return path
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")
    .replace(/\/$/, "");
}
