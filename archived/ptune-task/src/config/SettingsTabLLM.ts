import { Setting } from "obsidian";
import { config } from "./config";
import type { LlmProvider } from "./types";
import { i18n } from "../shared/i18n/I18n";

const PROVIDER_DEFAULTS: Record<LlmProvider, {
	baseUrl: string;
	model: string;
	maxTokens: number;
}> = {
	openai: {
		baseUrl: "https://api.openai.com/v1",
		model: "gpt-5-mini",
		maxTokens: 1200,
	},
	claude: {
		baseUrl: "https://api.anthropic.com/v1",
		model: "claude-3-5-haiku-20241022",
		maxTokens: 1200,
	},
	gemini: {
		baseUrl: "https://generativelanguage.googleapis.com/v1beta/models",
		model: "gemini-2.5-flash-lite",
		maxTokens: 2048,
	},
	custom: {
		baseUrl: "",
		model: "",
		maxTokens: 1200,
	},
};

function isProvider(value: string): value is LlmProvider {
	return ["openai", "claude", "gemini", "custom"].includes(value);
}

export function renderLLMSettings(containerEl: HTMLElement) {
	const t = i18n.settings.llm;

	containerEl.createEl("h2", { text: t.sectionTitle });

	new Setting(containerEl)
		.setName(t.provider.name)
		.setDesc(t.provider.desc)
		.addDropdown((dropdown) =>
			dropdown
				.addOptions({
					openai: t.provider.options.openai,
					claude: t.provider.options.claude,
					gemini: t.provider.options.gemini,
					custom: t.provider.options.custom,
				})
				.setValue(config.settings.llm.provider)
				.onChange(async (value) => {
					if (!isProvider(value)) return;

					config.settings.llm.provider = value;
					config.settings.llm.baseUrl = PROVIDER_DEFAULTS[value].baseUrl;
					config.settings.llm.model = PROVIDER_DEFAULTS[value].model;
					config.settings.llm.maxTokens = PROVIDER_DEFAULTS[value].maxTokens;
					await config.save();
				}),
		);

	new Setting(containerEl)
		.setName(t.apiKey.name)
		.setDesc(t.apiKey.desc)
		.addText((text) =>
			text
				.setPlaceholder(t.apiKey.placeholder)
				.setValue(config.settings.llm.apiKey)
				.onChange(async (value) => {
					config.settings.llm.apiKey = value.trim();
					await config.save();
				}),
		);

	new Setting(containerEl)
		.setName(t.baseUrl.name)
		.setDesc(t.baseUrl.desc)
		.addText((text) =>
			text
				.setPlaceholder(t.baseUrl.placeholder)
				.setValue(config.settings.llm.baseUrl)
				.onChange(async (value) => {
					config.settings.llm.baseUrl = value.trim();
					await config.save();
				}),
		);

	new Setting(containerEl)
		.setName(t.model.name)
		.setDesc(t.model.desc)
		.addText((text) =>
			text
				.setPlaceholder(t.model.placeholder)
				.setValue(config.settings.llm.model)
				.onChange(async (value) => {
					config.settings.llm.model = value.trim();
					await config.save();
				}),
		);

	new Setting(containerEl)
		.setName(t.temperature.name)
		.setDesc(t.temperature.desc)
		.addSlider((slider) =>
			slider
				.setLimits(0, 1, 0.1)
				.setDynamicTooltip()
				.setValue(config.settings.llm.temperature)
				.onChange(async (value) => {
					config.settings.llm.temperature = value;
					await config.save();
				}),
		);

	new Setting(containerEl)
		.setName(t.maxTokens.name)
		.setDesc(t.maxTokens.desc)
		.addText((text) =>
			text
				.setPlaceholder(t.maxTokens.placeholder)
				.setValue(String(config.settings.llm.maxTokens))
				.onChange(async (value) => {
					const parsed = Number.parseInt(value, 10);
					if (Number.isNaN(parsed)) return;

					config.settings.llm.maxTokens = parsed;
					await config.save();
				}),
		);
}
