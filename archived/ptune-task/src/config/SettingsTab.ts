import { App, PluginSettingTab, Setting } from "obsidian";
import PtunePlugin from "main";
import { config } from "./config";
import type { Lang } from "./types";
import { i18n } from "../shared/i18n/I18n";

import { renderBasicSettings } from "./SettingsTabBasic";
import { renderLLMSettings } from "./SettingsTabLLM";
import { renderNoteSettings } from "./SettingsTabNote";
import { renderReviewSettings } from "./SettingsTabReview";
import { renderDailyNoteTaskSettings } from "./SettingsTabDailyNote";
import { renderSnippetSettings } from "./SettingsTabSnippet";

function isLang(v: string): v is Lang {
	return ["ja", "en"].includes(v);
}

export class PtuneSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private readonly plugin: PtunePlugin,
	) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		const common = i18n.common;

		new Setting(containerEl)
			.setName(common.language.name)
			.setDesc(common.language.desc)
			.addDropdown((dropdown) =>
				dropdown
					.addOptions({
						ja: common.language.options.ja,
						en: common.language.options.en,
					})
					.setValue(config.settings.language)
					.onChange(async (value) => {
						if (!isLang(value)) return;

						config.settings.language = value;

						await config.save();

						i18n.init(value);

						this.display();
					}),
			);

		renderBasicSettings(containerEl);
		renderLLMSettings(containerEl);

		renderNoteSettings(containerEl);
		renderReviewSettings(containerEl);

		renderDailyNoteTaskSettings(containerEl);

		renderSnippetSettings(containerEl);
	}
}
