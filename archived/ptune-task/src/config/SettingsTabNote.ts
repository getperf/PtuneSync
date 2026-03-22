import { Setting } from "obsidian";
import { config } from "./config";
import { i18n } from "../shared/i18n/I18n";

function isPrefix(v: string): v is "serial" | "date" {
	return v === "serial" || v === "date";
}

export function renderNoteSettings(containerEl: HTMLElement) {
	const t = i18n.settings.note;

	containerEl.createEl("h2", { text: t.sectionTitle });

	new Setting(containerEl)
		.setName(t.folderPrefix.name)
		.setDesc(t.folderPrefix.desc)
		.addDropdown((dropdown) =>
			dropdown
				.addOptions({
					serial: t.folderPrefix.options.serial,
					date: t.folderPrefix.options.date,
				})
				.setValue(config.settings.note.folderPrefix)
				.onChange(async (value) => {
					if (!isPrefix(value)) return;
					config.settings.note.folderPrefix = value;
					await config.save();
				}),
		);

	new Setting(containerEl)
		.setName(t.notePrefix.name)
		.setDesc(t.notePrefix.desc)
		.addDropdown((dropdown) =>
			dropdown
				.addOptions({
					serial: t.notePrefix.options.serial,
					date: t.notePrefix.options.date,
				})
				.setValue(config.settings.note.notePrefix)
				.onChange(async (value) => {
					if (!isPrefix(value)) return;
					config.settings.note.notePrefix = value;
					await config.save();
				}),
		);

	new Setting(containerEl)
		.setName(t.prefixDigits.name)
		.setDesc(t.prefixDigits.desc)
		.addDropdown((dropdown) =>
			dropdown
				.addOptions({
					"2": "2",
					"3": "3",
					"4": "4",
					"5": "5",
				})
				.setValue(config.settings.note.prefixDigits.toString())
				.onChange(async (value) => {
					const num = parseInt(value, 10);
					if (!isNaN(num)) {
						config.settings.note.prefixDigits = num;
						await config.save();
					}
				}),
		);

	new Setting(containerEl)
		.setName(t.template.name)
		.setDesc(t.template.desc)
		.addTextArea((text) => {
			text.setPlaceholder(t.template.placeholder)
				.setValue(config.settings.note.templateText)
				.onChange(async (value) => {
					config.settings.note.templateText = value;
					await config.save();
				});

			text.inputEl.classList.add("my-template-textarea");
		});
}