// src/shared/i18n/settings/en.ts

export const settingsEn = {
	basic: {
		heading: "Basic Settings",

		logLevel: {
			name: "Log Level",
			desc: "Select log output level",
			options: {
				debug: "Debug",
				info: "Info",
				warn: "Warning",
				error: "Error",
				none: "None",
			},
		},

		enableLogFile: {
			name: "Enable Log File",
			desc: "Save logs to a file",
		},
	},

	llm: {
		sectionTitle: "LLM Settings",

		provider: {
			name: "Provider",
			desc: "LLM provider used for summarization",
			options: {
				openai: "OpenAI",
				claude: "Claude",
				gemini: "Gemini",
				custom: "Custom",
			},
		},

		apiKey: {
			name: "API Key",
			desc: "LLM API key",
			placeholder: "sk-...",
		},

		baseUrl: {
			name: "Base URL",
			desc: "Base API URL",
			placeholder: "https://api.openai.com/v1",
		},

		model: {
			name: "Model",
			desc: "Model name for summarization",
			placeholder: "gpt-5-mini",
		},

		temperature: {
			name: "Temperature",
			desc: "Sampling temperature for summarization",
		},

		maxTokens: {
			name: "Max Tokens",
			desc: "Maximum output tokens for summarization",
			placeholder: "1200",
		},
	},

	note: {
		sectionTitle: "Note Settings",

		folderPrefix: {
			name: "Folder Prefix",
			desc: "Prefix rule for project/journal folders",
			options: {
				serial: "Serial",
				date: "Date",
			},
		},

		notePrefix: {
			name: "Note Prefix",
			desc: "Prefix rule for note filenames",
			options: {
				serial: "Serial",
				date: "Date",
			},
		},

		prefixDigits: {
			name: "Prefix Digits",
			desc: "Zero-padding length for serial numbers",
		},

		template: {
			name: "Template File",
			desc: "Template used for new notes",
			placeholder: "_templates/note/default.md",
		},
	},

	review: {
		sectionTitle: "Review Settings",

		notesReviewEnabledDefault: {
			name: "Daily notes review",
			desc: "Enable daily notes review by default when running the review command",
		},

		reviewPointOutputFormat: {
			name: "Reflection point format",
			desc: "Default output format for reflection points inside daily notes review",
			options: {
				outline: "outline",
				xmind: "xmind",
			},
		},
	},

	dailyNoteTask: {
		sectionTitle: "Daily Task Settings",

		habit: {
			morning: {
				name: "Morning list",
				desc: "Enter the tasks you perform each morning, one per line",
				placeholder: "e.g. Exercise\nMeditate",
			},

			evening: {
				name: "Evening list",
				desc: "Enter the tasks you perform each evening, one per line",
				placeholder: "e.g. Write journal\nStretch",
			},
		},

		tagSuggestions: {
			name: "Tag suggestions",
			desc: "Code completion candidates for task tags (one per line)",
			placeholder: "Design\nResearch\nPrototype\nImplementation\nVerification",
		},

		goalSuggestions: {
			name: "Goal suggestions",
			desc: "Code completion candidates for task goals (one per line)",
			placeholder: "Requirements finalized\nDesign complete\nImplementation complete\nTest coverage added\nRefactoring complete\nBug fix complete",
		},

		subTaskTemplates: {
			name: "Sub-task templates",
			desc: "Code completion candidates for sub-tasks (one per line)",
			placeholder: "Requirements review #Design 🍅x1\nUse cases #Design 🍅x1\nChange analysis #Research 🍅x1\nPrototype #Implementation 🍅x1\nBug fix #Implementation 🍅x1\nReview #Verification 🍅x1\nRegression test #Verification 🍅x1",
		},
	},

	snippet: {
		sectionTitle: "Snippet Settings",

		snippetFile: {
			name: "Snippet File",
			desc: "Path to the snippet definition file",
			placeholder: "_snippets/snippets.md",
		},
	},
} as const;
