import { Notice, Plugin } from "obsidian";
import { Container } from "./container";

export function registerAllCommands(plugin: Plugin, container: Container): void {
  plugin.addCommand({
    id: "pull-today",
    name: "Pull Today",
    callback: () => { container.createPullTodayCommand().execute(); },
  });

  plugin.addCommand({
    id: "sync",
    name: "Push and Rebuild",
    callback: () => { container.createSyncAndRebuildCommand().execute(); },
  });

  plugin.addCommand({
    id: "review",
    name: "Generate Daily Review",
    callback: () => { container.createReviewCommand().execute(); },
  });

  plugin.addCommand({
    id: "login",
    name: "Login",
    callback: async () => {
      try {
        await container.createAuthService().login();
        new Notice("Google login successful.");
      } catch (e: unknown) {
        new Notice(`Login failed: ${e instanceof Error ? e.message : String(e)}`);
      }
    },
  });

  plugin.addCommand({
    id: "auth-status",
    name: "Auth Status",
    callback: async () => {
      try {
        const result = await container.createAuthService().status();
        new Notice(`Authenticated: ${result.email ?? "unknown"}`);
      } catch {
        new Notice("Not authenticated. Please login.");
      }
    },
  });
}
