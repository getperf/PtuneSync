import { PluginSettings } from "./types";

export const DEFAULT_SETTINGS: PluginSettings = {
	language: "ja",

	logLevel: "info",
	enableLogFile: false,
	llm: {
		provider: "openai",
		apiKey: "",
		baseUrl: "https://api.openai.com/v1",
		model: "gpt-5-mini",
		temperature: 0.2,
		maxTokens: 1200,
	},

	note: {
		folderPrefix: "serial",
		notePrefix: "serial",
		prefixDigits: 3,
		templateText: "",
	},

	snippet: {
		filename: "snippet.md",
	},

	review: {
		sentenceMode: "llm",
		noteSummaryOutputFormat: "outline",
		reviewPointOutputFormat: "outline",
		taskReviewEnabledDefault: true,
		notesReviewEnabledDefault: true,
		taskReviewOutputFormat: "outline",
	},

	habitTasks: {
		morning: [],
		evening: [],
	},

	dailyNoteTask: {
		habit: {
			morning: [],
			evening: [],
		},
		tagSuggestions: ["設計", "調査", "試作", "実装", "検証"],
		goalSuggestions: [
			"仕様確定",
			"設計整理完了",
			"実装完了",
			"テスト追加完了",
			"リファクタリング完了",
			"バグ修正完了",
		],
		subTaskTemplates: [
			"要件整理 #設計 🍅x1",
			"ユースケース #設計 🍅x1",
			"変更調査 #調査 🍅x1",
			"プロトタイプ #実装 🍅x1",
			"バグ修正 #実装 🍅x1",
			"レビュー #検証 🍅x1",
			"リグレッション #検証 🍅x1",
		],
	},
}
