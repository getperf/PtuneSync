import { Setting } from "obsidian";
import { config } from "./config";
import { i18n } from "../shared/i18n/I18n";

export function renderDailyNoteTaskSettings(containerEl: HTMLElement) {
  const t = i18n.settings.dailyNoteTask;

  containerEl.createEl("h2", { text: t.sectionTitle });

  renderHabitSettings(containerEl);
  renderTagSuggestions(containerEl);
  renderGoalSuggestions(containerEl);
  renderSubTaskTemplates(containerEl);
}

function renderHabitSettings(containerEl: HTMLElement) {
  const t = i18n.settings.dailyNoteTask.habit;

  new Setting(containerEl)
    .setName(t.morning.name)
    .setDesc(t.morning.desc)
    .addTextArea((text) => {
      text
        .setPlaceholder(t.morning.placeholder)
        .setValue(
          config.settings.dailyNoteTask?.habit.morning.join("\n") ?? ""
        )
        .onChange(async (value) => {
          if (!config.settings.dailyNoteTask) {
            config.settings.dailyNoteTask = {
              habit: { morning: [], evening: [] },
              tagSuggestions: [],
              goalSuggestions: [],
              subTaskTemplates: [],
            };
          }
          config.settings.dailyNoteTask.habit.morning = value
            .split(/\r?\n/)
            .map((s) => s.trim())
            .filter(Boolean);
          await config.save();
        });

      text.inputEl.rows = 3;
    });

  new Setting(containerEl)
    .setName(t.evening.name)
    .setDesc(t.evening.desc)
    .addTextArea((text) => {
      text
        .setPlaceholder(t.evening.placeholder)
        .setValue(
          config.settings.dailyNoteTask?.habit.evening.join("\n") ?? ""
        )
        .onChange(async (value) => {
          if (!config.settings.dailyNoteTask) {
            config.settings.dailyNoteTask = {
              habit: { morning: [], evening: [] },
              tagSuggestions: [],
              goalSuggestions: [],
              subTaskTemplates: [],
            };
          }
          config.settings.dailyNoteTask.habit.evening = value
            .split(/\r?\n/)
            .map((s) => s.trim())
            .filter(Boolean);
          await config.save();
        });

      text.inputEl.rows = 3;
    });
}

function renderTagSuggestions(containerEl: HTMLElement) {
  const t = i18n.settings.dailyNoteTask.tagSuggestions;

  new Setting(containerEl)
    .setName(t.name)
    .setDesc(t.desc)
    .addTextArea((text) => {
      text
        .setPlaceholder(t.placeholder)
        .setValue(
          config.settings.dailyNoteTask?.tagSuggestions.join("\n") ?? ""
        )
        .onChange(async (value) => {
          if (!config.settings.dailyNoteTask) {
            config.settings.dailyNoteTask = {
              habit: { morning: [], evening: [] },
              tagSuggestions: [],
              goalSuggestions: [],
              subTaskTemplates: [],
            };
          }
          config.settings.dailyNoteTask.tagSuggestions = value
            .split(/\r?\n/)
            .map((s) => s.trim())
            .filter(Boolean);
          await config.save();
        });

      text.inputEl.rows = 4;
    });
}

function renderGoalSuggestions(containerEl: HTMLElement) {
  const t = i18n.settings.dailyNoteTask.goalSuggestions;

  new Setting(containerEl)
    .setName(t.name)
    .setDesc(t.desc)
    .addTextArea((text) => {
      text
        .setPlaceholder(t.placeholder)
        .setValue(
          config.settings.dailyNoteTask?.goalSuggestions.join("\n") ?? ""
        )
        .onChange(async (value) => {
          if (!config.settings.dailyNoteTask) {
            config.settings.dailyNoteTask = {
              habit: { morning: [], evening: [] },
              tagSuggestions: [],
              goalSuggestions: [],
              subTaskTemplates: [],
            };
          }
          config.settings.dailyNoteTask.goalSuggestions = value
            .split(/\r?\n/)
            .map((s) => s.trim())
            .filter(Boolean);
          await config.save();
        });

      text.inputEl.rows = 5;
    });
}

function renderSubTaskTemplates(containerEl: HTMLElement) {
  const t = i18n.settings.dailyNoteTask.subTaskTemplates;

  new Setting(containerEl)
    .setName(t.name)
    .setDesc(t.desc)
    .addTextArea((text) => {
      text
        .setPlaceholder(t.placeholder)
        .setValue(
          config.settings.dailyNoteTask?.subTaskTemplates.join("\n") ?? ""
        )
        .onChange(async (value) => {
          if (!config.settings.dailyNoteTask) {
            config.settings.dailyNoteTask = {
              habit: { morning: [], evening: [] },
              tagSuggestions: [],
              goalSuggestions: [],
              subTaskTemplates: [],
            };
          }
          config.settings.dailyNoteTask.subTaskTemplates = value
            .split(/\r?\n/)
            .map((s) => s.trim())
            .filter(Boolean);
          await config.save();
        });

      text.inputEl.rows = 6;
    });
}
