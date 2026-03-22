import { Plugin } from "obsidian";
import { TaskInlineSuggest } from "../presentation/editor/TaskInlineSuggest";

export function registerEditorFeatures(plugin: Plugin): void {
  plugin.registerEditorSuggest(new TaskInlineSuggest(plugin.app));
}
