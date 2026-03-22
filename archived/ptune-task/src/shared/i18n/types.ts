import { ja } from "./ja";
import type { PromptDictionary } from "./prompts/types";

/**
 * Convert literal string types to string
 */
type LiteralToString<T> = T extends string
	? string
	: { [K in keyof T]: LiteralToString<T[K]> };

export type I18nSchema = LiteralToString<typeof ja>;

export type I18nPromptSchema = PromptDictionary;
