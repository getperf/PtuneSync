import { Plugin } from "obsidian";
import { Container } from "./container";

export function registerWorkspaceFeatures(
  plugin: Plugin,
  container: Container,
): void {
  container.createNoteCreationFeature().start(plugin);
  container.createNoteReviewFeature().start(plugin);
}
