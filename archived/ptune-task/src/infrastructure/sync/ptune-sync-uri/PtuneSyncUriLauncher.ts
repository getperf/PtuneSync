// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { shell } from "electron";

export class PtuneSyncUriLauncher {
  async launch(uri: string): Promise<void> {
    if (!shell || typeof shell.openExternal !== "function") {
      throw new Error("Electron shell is unavailable");
    }

    await shell.openExternal(uri);
  }
}
