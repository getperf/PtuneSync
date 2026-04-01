import { Setting } from "obsidian";
import { config } from "./config";
import { i18n } from "../shared/i18n/I18n";

export function renderSnippetSettings(containerEl: HTMLElement) {
	const t = i18n.settings.snippet;

	containerEl.createEl("h2", { text: t.sectionTitle });

	new Setting(containerEl)
		.setName(t.snippetFile.name)
		.setDesc(t.snippetFile.desc)
		.addText((text) =>
			text
				.setPlaceholder(t.snippetFile.placeholder)
				.setValue(config.settings.snippet.filename)
				.onChange(async (value) => {
					config.settings.snippet.filename =
						value.trim() || "snippet.md";

					await config.save();
				}),
		);
}
