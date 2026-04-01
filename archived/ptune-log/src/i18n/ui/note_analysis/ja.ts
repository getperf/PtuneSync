// src/i18n/ui/note_analysis/ja.ts

export const noteAnalysisJa = {
  command: {
    runKpt: 'KPT分析（レビュー反映）を実行',
  },

  summary: {
    taskReview: {
      empty: '（タスク振り返りが存在しません）',
      notFound: '（日次要約が見つかりませんでした）',
    },

    noteReview: {
      empty: '（ノートレビューが存在しません）',
      noValidItems: '（ノートレビューに有効な項目がありません）',
    },
  },

  prompt: {
    kpt: {
      taskReviewTitle: 'タスクの振り返り要約',
      noteReviewTitle: 'ノートの振り返り要約',
    },
  },

  modal: {
    title: 'ノート分析',

    button: {
      start: '分析を開始',
      cancel: 'キャンセル',
    },

    message: {
      running: 'ノートを分析しています…',
      completed: 'ノート分析が完了しました',
      error: 'ノート分析中にエラーが発生しました',

      // --- KPT Analysis UseCase 用 ---
      noDailyNote: 'デイリーノートを開いてから実行してください',
      llmFailed: 'KPT分析の実行に失敗しました',
      updated: 'KPT分析を更新しました',
    },
  },

  kpt: {
    outliner: {
      comment: {
        title: 'ショートカットキー（Outliner）',
        body: '行移動(Ctrl + Shift + ↑ / ↓), 階層変更(Tab / Shift + Tab), 削除(範囲選択 → Delete)',
      },
    },
  },
};
