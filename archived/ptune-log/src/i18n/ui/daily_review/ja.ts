// src/i18n/ui/daily_review/ja.ts

export const dailyReviewJa = {
  command: {
    runOnFolder: '振り返り: フォルダを指定して実行',
    runOnDate: '振り返り: 日付を指定して実行',
  },

  notice: {
    noMarkdownFiles: 'Markdownファイルが見つかりません',
    failed: '振り返り処理中にエラーが発生しました',
  },

  message: {
    completed: '今日の振り返りが完了しました',
  },

  modal: {
    title: {
      date: '今日の振り返り（日付指定）',
      folder: '記録ノートの要約生成',
    },

    dateSelect: {
      label: '対象日（タグ抽出＆保存）',
      description: '過去7日間から選択してください',
    },

    confirm: {
      withCount:
        '{count} 件の記録ノートに要約とタグを追加します。実行しますか？',
    },

    option: {
      /** 既存 */
      forceRegenerate: {
        label: '解析済みノートも再実行する',
        description: 'summary/tags があるノートも LLM で再解析します',
      },

      /** 追加：センテンス要約モード */
      sentenceMode: {
        label: 'センテンスの扱い',
        description:
          'ノート要約をそのまま使うか、LLMで短く要約するかを選択します',
        raw: 'そのまま使用（要約なし）',
        llm: 'LLMで要約する',
      },

      /** 追加：出力フォーマット */
      outputFormat: {
        label: 'ノートサマリ出力形式',
        description: '生成されるレポートの構造を、用途に応じて選択します',
        outliner: 'Outliner（折りたたみ可能な階層表示）',
        xmind: 'XMind（マインドマップ向け構造）',
      },
    },

    progress: {
      start: '処理開始 ({total} 件)',
      processing: '処理中: {path}',
      finished: '完了: 成功 {success} 件 / エラー {errors} 件',
    },
  },
};
