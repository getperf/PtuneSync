import * as vscode from "vscode";
import { TaskLineValidator } from "../infrastructure/vscode/validation/TaskLineValidator";

export function registerTaskLineValidation(
  context: vscode.ExtensionContext,
): void {
  const validator = new TaskLineValidator();

  const disposable = vscode.workspace.onDidChangeTextDocument((event) => {
    validator.validateDocumentChange(event);
  });

  context.subscriptions.push(disposable);
}