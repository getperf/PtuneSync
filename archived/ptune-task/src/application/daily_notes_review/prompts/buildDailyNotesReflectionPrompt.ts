import { i18n } from "../../../shared/i18n/I18n";

export function buildDailyNotesReflectionPrompt(): string {
  return i18n.prompts.dailyNotesReflection.system.lines.join("\n");
}
