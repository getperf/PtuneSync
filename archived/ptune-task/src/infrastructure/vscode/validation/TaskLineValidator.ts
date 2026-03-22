import * as vscode from "vscode";
import { TaskLineMetaParser } from "../../conversion/task/markdown/TaskLineMetaParser";
import { isTaskLine } from "../completion/TaskLineDetector";

export class TaskLineValidator {
  validateDocumentChange(event: vscode.TextDocumentChangeEvent): void {
    const document = event.document;

    if (document.languageId !== "markdown") {
      return;
    }

    for (const change of event.contentChanges) {
      const lineNumber = change.range.start.line;
      const line = document.lineAt(lineNumber).text;

      if (!isTaskLine(line)) {
        continue;
      }

      try {
        TaskLineMetaParser.parse(line);
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Invalid task format";

        vscode.window.showWarningMessage(
          `[ptuneTask] Task format error:\n${message}\n→ 修正してください`,
        );
      }
    }
  }
}