import { i18n } from "../../../shared/i18n/I18n";

export function buildNoteSummarySystemPrompt(): string {
  return i18n.prompts.noteSummary.system.lines.join("\n");
}
