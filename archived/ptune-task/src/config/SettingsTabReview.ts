import { Setting } from "obsidian";
import { config } from "./config";
import { i18n } from "../shared/i18n/I18n";

export function renderReviewSettings(containerEl: HTMLElement) {
  const t = i18n.settings.review;

  containerEl.createEl("h2", { text: t.sectionTitle });

  new Setting(containerEl)
    .setName(t.notesReviewEnabledDefault.name)
    .setDesc(t.notesReviewEnabledDefault.desc)
    .addToggle((toggle) =>
      toggle
        .setValue(config.settings.review.notesReviewEnabledDefault)
        .onChange(async (value) => {
          config.settings.review.notesReviewEnabledDefault = value;
          await config.save();
        }),
    );

  new Setting(containerEl)
    .setName(t.reviewPointOutputFormat.name)
    .setDesc(t.reviewPointOutputFormat.desc)
    .addDropdown((dropdown) =>
      dropdown
        .addOptions({
          outline: t.reviewPointOutputFormat.options.outline,
          xmind: t.reviewPointOutputFormat.options.xmind,
        })
        .setValue(config.settings.review.reviewPointOutputFormat)
        .onChange(async (value) => {
          if (value !== "outline" && value !== "xmind") {
            return;
          }

          config.settings.review.reviewPointOutputFormat = value;
          await config.save();
        }),
    );
}
