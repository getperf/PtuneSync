import { moment, normalizePath } from "obsidian";

export class DailyNotePathResolver {
  constructor(
    private readonly baseDir: string,
    private readonly format: string,
  ) {}

  resolve(date: string): string {
    const parsed = moment(date, "YYYY-MM-DD", true);

    if (!parsed.isValid()) {
      throw new Error(`Invalid daily note date: ${date}`);
    }

    const basename = parsed.format(this.format || "YYYY-MM-DD");
    const path = this.baseDir ? `${this.baseDir}/${basename}` : basename;

    return normalizePath(path.endsWith(".md") ? path : `${path}.md`);
  }

  parse(path: string): string | null {
    const normalized = normalizePath(path);
    const baseDir = normalizePath(this.baseDir || "");
    const relative = baseDir
      ? normalized.startsWith(`${baseDir}/`)
        ? normalized.slice(baseDir.length + 1)
        : null
      : normalized;

    if (!relative || !relative.endsWith(".md")) {
      return null;
    }

    const withoutExtension = relative.slice(0, -3);
    const parsed = moment(
      withoutExtension,
      this.format || "YYYY-MM-DD",
      true,
    );

    return parsed.isValid()
      ? parsed.format("YYYY-MM-DD")
      : null;
  }
}
