export const commonJa = {
	language: {
		name: "言語",
		desc: "UI 表示に使用する言語",
		options: {
			ja: "日本語",
			en: "英語",
		},
	},

	notice: {
		apiKeyNotSet: "⚠️ APIキー未設定",
		failed: "処理に失敗しました",
	},

	action: {
		create: "作成",
		confirm: "実行する",
		cancel: "キャンセル",
		close: "閉じる",
	},

	noteCreation: {
		menu: {
			createProjectFolder: "プロジェクトフォルダ作成",
			createProjectNote: "ノート作成",
		},

		modal: {
			projectFolderTitle: "プロジェクトフォルダ作成",
			projectNoteTitle: "ノート作成",
			targetLabel: "対象フォルダ",
			taskKeyLabel: "タスクを選択",
			taskKeyEmptyOption: "(選択なし)",
			titleLabel: "タイトル",
			titlePlaceholder: "タイトルを入力",
		},

		notice: {
			titleRequired: "タイトルが未入力です",
			invalidTitle: "タイトルに無効な文字があります",
			projectFolderCreated: "プロジェクトフォルダを作成しました",
			projectNoteCreated: "ノートを作成しました",
			createFailed: "作成に失敗しました",
		},
	},

	noteReview: {
		command: {
			current: "ノート要約を生成",
			menu: "ノート要約",
		},
		modal: {
			title: "ノート要約",
			summaryLabel: "要約",
			save: "保存",
			regenerate: "再生成",
		},
		notice: {
			saved: "ノート要約を保存しました",
			failed: "ノート要約の生成に失敗しました",
			noActiveNote: "アクティブなノートがありません",
			apiKeyNotSet: "LLM の API キーが未設定です",
		},
	},

	daily: {
		section: {
			planned: { title: "今日の予定タスク" },
			timelog: { title: "タイムログ／メモ" },
			review: { title: "タスク振り返り" },
			timetable: { title: "タイムテーブル" },
			unfinished: { title: "未完了タスク" },
			timeanalysis: { title: "時間分析" },
			memo: { title: "振り返りメモ" },
			tags: { title: "タグ一覧（当日生成）" },
			unregistered: { title: "未登録タグ候補（要レビュー）" },
			report: { title: "デイリーレポート" },
			reviewpoint: { title: "振り返りポイント" },
		},

		planned: {
			comment: {
				line1: "作業開始時に1日のタスクリストを記入してください。朝の開始時に予定タスクを作成（pullで未完了を取り込み→整理→pushで反映）。",
				line2: "日中の追加・変更はpushで差分更新します。",
			},
		},

		reviewpoint: {
			comment: {
				outline: [
					"下記は当日のノート要約から抽出した振り返り素材です。",
					"重複を整理し、粒度をそろえ、必要な補足を追記して振り返りポイントとして整えてください。",
				],
				xmind: [
					"[XMind による振り返り手順]",
					"1. 次の編集用 XMind ファイルを開いてください。",
					"2. 「インプット（XMind 用）」の内容をすべてコピーして XMind に貼り付けてください。",
					"3. XMind 上で構造、粒度、表現を整理してください。",
					"4. 整理した結果を「アウトプット（XMind 編集結果）」に貼り戻してください。",
				],
			},
			xmindFileLinkLabel: "編集用 XMind ファイルを開く",
			xmindInputHeading: "インプット（XMind 用）",
			xmindOutputHeading: "アウトプット（XMind 編集結果）",
		},
	},

	review: {
		flag: {
			operationMiss: "止め忘れ",
			toolOrEnvIssue: "環境問題",
			decisionPending: "未解決",
			scopeExpanded: "難問",
			unresolved: "残件あり",
			newIssueFound: "新たな課題",
			unknown: "不明",
		},
	},

	reviewFlow: {
		setup: {
			title: "レビューを実行",
			dateLabel: "対象日",
			taskReviewLabel: "タスクレビュー",
			notesReviewLabel: "当日作成ノートレビュー",
			reviewPointFormatLabel: "振り返りポイント形式",
			run: "実行",
			atLeastOneRequired: "少なくとも1つのレビューを選択してください",
			options: {
				outline: "outline",
				xmind: "xmind",
			},
		},
		progress: {
			title: "レビュー実行中",
			running: "実行中...",
			completed: "レビューが完了しました。まもなく閉じます",
			failed: "エラーが発生しました",
			events: {
				started: "レビューを開始しました",
				taskReviewStarted: "タスクレビューを開始しました",
				taskReviewSkipped: "タスクレビューをスキップしました",
				taskReviewCompleted: "タスクレビューが完了しました",
				notesReviewStarted: "当日作成ノートレビューを開始しました",
				notesReviewSkipped: "当日作成ノートレビューをスキップしました",
				notesReviewProgress: "ノート要約を生成中",
				notesReviewCompleted: "当日作成ノートレビューが完了しました",
			},
		},
	},

	push: {
		confirm: {
			planning: {
				title: "洗い替えで同期します",
				message:
					"既存の当日タスクを削除してから再登録します。過去の完了・未完了タスクも削除対象になります。",
			},
			working: {
				title: "差分を同期します",
				message: "差分を追加または更新します。削除は行いません。",
			},
			summary: {
				create: "Create",
				update: "Update",
				delete: "Delete",
			},
		},
	},
} as const;
