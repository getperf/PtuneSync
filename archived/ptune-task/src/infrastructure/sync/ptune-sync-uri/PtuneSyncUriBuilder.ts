import { PtuneSyncWorkDir } from "./PtuneSyncWorkDir";

export class PtuneSyncUriBuilder {
  constructor(private readonly workDir: PtuneSyncWorkDir) { }

  buildAuthStatus(): string {
    return this.build("auth/status");
  }

  buildAuthLogin(): string {
    return this.build("auth/login");
  }

  buildPull(list: string, includeCompleted: boolean): string {
    return this.build("pull", {
      list,
      "include-completed": includeCompleted ? "true" : undefined,
    });
  }

  buildReview(list: string): string {
    return this.build("review", { list });
  }

  buildDiff(inputPath: string, list: string): string {
    return this.build("diff", { input: inputPath, list });
  }

  buildPush(inputPath: string, list: string, allowDelete: boolean): string {
    return this.build("push", {
      input: inputPath,
      list,
      "allow-delete": allowDelete ? "true" : undefined,
    });
  }

  private build(
    path: string,
    params: Record<string, string | undefined> = {},
  ): string {
    const search = new URLSearchParams();

    search.set("home", this.workDir.getRootAbsolute());

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        search.set(key, value);
      }
    }

    return `ptune-sync://${path}?${search.toString()}`;
  }
}
