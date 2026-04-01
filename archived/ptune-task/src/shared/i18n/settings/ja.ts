// src/shared/i18n/settings/ja.ts

export const settingsJa = {
	basic: {
		heading: "基本設定",

		logLevel: {
			name: "ログレベル",
			desc: "ログの出力レベルを指定します",
			options: {
				debug: "デバッグ",
				info: "情報",
				warn: "警告",
				error: "エラー",
				none: "出力しない",
			},
		},

		enableLogFile: {
			name: "ログファイル出力",
			desc: "ログをファイルに保存します",
		},
	},

	llm: {
		sectionTitle: "LLM 設定",

		provider: {
			name: "プロバイダー",
			desc: "要約生成に使う LLM プロバイダー",
			options: {
				openai: "OpenAI",
				claude: "Claude",
				gemini: "Gemini",
				custom: "Custom",
			},
		},

		apiKey: {
			name: "API キー",
			desc: "LLM API キー",
			placeholder: "sk-...",
		},

		baseUrl: {
			name: "Base URL",
			desc: "API のベース URL",
			placeholder: "https://api.openai.com/v1",
		},

		model: {
			name: "モデル",
			desc: "要約に使うモデル名",
			placeholder: "gpt-5-mini",
		},

		temperature: {
			name: "Temperature",
			desc: "要約生成のゆらぎ",
		},

		maxTokens: {
			name: "Max Tokens",
			desc: "要約生成の最大トークン数",
			placeholder: "1200",
		},
	},

	note: {
		sectionTitle: "ノート設定",

		folderPrefix: {
			name: "フォルダ接頭辞",
			desc: "プロジェクト／日誌フォルダ名の付与方式",
			options: {
				serial: "連番",
				date: "日付",
			},
		},

		notePrefix: {
			name: "ノート接頭辞",
			desc: "ノートファイル名の付与方式",
			options: {
				serial: "連番",
				date: "日付",
			},
		},

		prefixDigits: {
			name: "連番の桁数",
			desc: "連番指定時のゼロ埋め桁数",
		},

		template: {
			name: "テンプレートファイル",
			desc: "新規ノート作成時に使用するテンプレート",
			placeholder: "_templates/note/default.md",
		},
	},

	review: {
		sectionTitle: "レビュー設定",

		notesReviewEnabledDefault: {
			name: "当日作成ノートレビュー",
			desc: "レビューコマンド実行時の既定で、当日作成ノートレビューを有効にします",
		},

		reviewPointOutputFormat: {
			name: "振り返りポイント形式",
			desc: "当日作成ノートレビュー内の振り返りポイントの既定出力形式",
			options: {
				outline: "outline",
				xmind: "xmind",
			},
		},
	},

	dailyNoteTask: {
		sectionTitle: "日次タスク設定",

		habit: {
			morning: {
				name: "朝のタスク",
				desc: "毎朝確認・実行するタスクを改行区切りで入力します",
				placeholder: "<朝>くすり🚫",
			},

			evening: {
				name: "夜のタスク",
				desc: "毎晩確認・実行するタスクを改行区切りで入力します",
				placeholder: "<夜>プール🚫",
			},
		},

		tagSuggestions: {
			name: "タグ候補",
			desc: "タスク入力時のコード補完候補リスト（改行区切り）",
			placeholder: "設計\n調査\n試作\n実装\n検証",
		},

		goalSuggestions: {
			name: "ゴール候補",
			desc: "タスク完了目標のコード補完候補リスト（改行区切り）",
			placeholder: "仕様確定\n設計整理完了\n実装完了\nテスト追加完了\nリファクタリング完了\nバグ修正完了",
		},

		subTaskTemplates: {
			name: "サブタスクテンプレート",
			desc: "サブタスク入力時のコード補完候補リスト（改行区切り）",
			placeholder: "要件整理 #設計 🍅x1\nユースケース #設計 🍅x1\n変更調査 #調査 🍅x1\nプロトタイプ #実装 🍅x1\nバグ修正 #実装 🍅x1\nレビュー #検証 🍅x1\nリグレッション #検証 🍅x1",
		},
	},

	snippet: {
		sectionTitle: "スニペット設定",

		snippetFile: {
			name: "スニペットファイル",
			desc: "登録済みスニペット定義ファイルのパス",
			placeholder: "_snippets/snippets.md",
		},
	},
} as const;
