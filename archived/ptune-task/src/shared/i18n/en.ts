import { settingsEn } from "./settings/en";
import { commonEn } from "./common/en";
import { promptsEn } from "./prompts/en";
import type { I18nSchema } from "./types";

export const en = {
	settings: settingsEn,
	common: commonEn,
	prompts: promptsEn,
} satisfies I18nSchema;
