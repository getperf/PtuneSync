import {
  App,
  Editor,
  EditorPosition,
  EditorSuggest,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
  TFile,
} from "obsidian";
import { getDailyNoteSettings } from "obsidian-daily-notes-interface";
import { config } from "../../config/config";
import {
  getTaskBodyStart,
  isEmptyTaskTemplateTriggerLine,
  isTaskLine,
} from "../../application/completion/TaskLineDetector";
import {
  detectTaskTrigger,
  TaskTriggerKind,
} from "../../application/completion/TaskTriggerDetector";
import { isInsidePlannedSection } from "../../application/completion/PlannedSectionDetector";
import { DailyNotePathResolver } from "../../infrastructure/repository/DailyNotePathResolver";

interface TaskSuggestionItem {
  kind: TaskTriggerKind;
  label: string;
  insertText: string;
  start: EditorPosition;
  end: EditorPosition;
}

export class TaskInlineSuggest extends EditorSuggest<TaskSuggestionItem> {
  constructor(app: App) {
    super(app);
    this.setInstructions([
      { command: "Enter", purpose: "insert" },
      { command: "Esc", purpose: "dismiss" },
    ]);
  }

  onTrigger(
    cursor: EditorPosition,
    editor: Editor,
    file: TFile | null,
  ): EditorSuggestTriggerInfo | null {
    if (!file || !this.isDailyNoteFile(file)) {
      return null;
    }

    const line = editor.getLine(cursor.line);
    const prefix = line.slice(0, cursor.ch);

    if (prefix !== line || !isTaskLine(line)) {
      return null;
    }

    const lines = editor.getValue().split("\n");

    if (!isInsidePlannedSection(lines, cursor.line)) {
      return null;
    }

    if (isEmptyTaskTemplateTriggerLine(line)) {
      return {
        start: { line: cursor.line, ch: cursor.ch - 2 },
        end: cursor,
        query: "",
      };
    }

    const match = detectTaskTrigger(prefix);

    if (!match || match.kind === "subtask") {
      return null;
    }

    return {
      start: { line: cursor.line, ch: match.startCh },
      end: cursor,
      query: match.query,
    };
  }

  getSuggestions(context: EditorSuggestContext): TaskSuggestionItem[] {
    const line = context.editor.getLine(context.start.line);
    const prefix = line.slice(0, context.end.ch);

    if (isEmptyTaskTemplateTriggerLine(line)) {
      const templates = config.settings.dailyNoteTask?.subTaskTemplates ?? [];

      return templates.map((template) => ({
        kind: "subtask",
        label: template,
        insertText: template,
        start: {
          line: context.start.line,
          ch: getTaskBodyStart(line) ?? context.start.ch,
        },
        end: {
          line: context.end.line,
          ch: line.length,
        },
      }));
    }

    const trigger = detectTaskTrigger(prefix);

    if (!trigger) {
      return [];
    }

    const suggestions = this.getSuggestionValues(trigger.kind, context.query);

    return suggestions.map((value) => ({
      kind: trigger.kind,
      label: value.label,
      insertText: value.insertText,
      start: context.start,
      end: context.end,
    }));
  }

  renderSuggestion(value: TaskSuggestionItem, el: HTMLElement): void {
    el.createDiv({ text: value.label });
  }

  selectSuggestion(value: TaskSuggestionItem): void {
    if (!this.context) {
      return;
    }

    const editor = this.context.editor;

    editor.replaceRange(value.insertText, value.start, value.end);
    editor.setCursor({
      line: value.start.line,
      ch: value.start.ch + value.insertText.length,
    });

    this.close();
  }

  private getSuggestionValues(
    kind: Exclude<TaskTriggerKind, "subtask">,
    query: string,
  ): Array<{ label: string; insertText: string }> {
    switch (kind) {
      case "tag":
        return (config.settings.dailyNoteTask?.tagSuggestions ?? [])
          .filter((tag) => tag.startsWith(query))
          .slice(0, 10)
          .map((tag) => ({
            label: tag,
            insertText: ` #${tag}`,
          }));
      case "goal":
        return (config.settings.dailyNoteTask?.goalSuggestions ?? [])
          .filter((goal) => goal.startsWith(query))
          .slice(0, 10)
          .map((goal) => ({
            label: goal,
            insertText: ` | ${goal}`,
          }));
      case "pomodoro":
        return Array.from({ length: 8 }, (_, i) => i + 1)
          .map((count) => ({
            label: `🍅x${count}`,
            insertText: ` 🍅x${count}`,
          }))
          .filter((item) => item.label.startsWith(query));
    }
  }

  private isDailyNoteFile(file: TFile): boolean {
    const settings = getDailyNoteSettings();
    const resolver = new DailyNotePathResolver(
      settings.folder?.trim() || "",
      settings.format?.trim() || "YYYY-MM-DD",
    );

    return resolver.parse(file.path) !== null;
  }
}
