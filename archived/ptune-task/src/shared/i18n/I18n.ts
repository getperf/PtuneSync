import { ja } from "./ja";
import { en } from "./en";
import type { I18nSchema } from "./types";

export type Lang = "ja" | "en";

export class I18n {
	private dict: I18nSchema = ja;

	init(lang: Lang) {
		this.dict = lang === "ja" ? ja : en;
	}

	get settings() {
		return this.dict.settings;
	}

	get common() {
		return this.dict.common;
	}

	get prompts() {
		return this.dict.prompts;
	}
}

export const i18n = new I18n();
