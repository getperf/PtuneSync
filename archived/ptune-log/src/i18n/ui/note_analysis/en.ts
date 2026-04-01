// src/i18n/ui/note_analysis/en.ts

export const noteAnalysisEn = {
  command: {
    runKpt: 'Run KPT Analysis (Apply Reviews)',
  },

  summary: {
    taskReview: {
      empty: '(No task review section found)',
      notFound: '(Daily summary was not found)',
    },

    noteReview: {
      empty: '(No note review found)',
      noValidItems: '(No valid items found in note review)',
    },
  },

  prompt: {
    kpt: {
      taskReviewTitle: 'Task Review Summary',
      noteReviewTitle: 'Note Review Summary',
    },
  },

  modal: {
    title: 'Note Analysis',

    button: {
      start: 'Start Analysis',
      cancel: 'Cancel',
    },

    message: {
      running: 'Analyzing notes…',
      completed: 'Note analysis completed',
      error: 'An error occurred during note analysis',

      // --- KPT Analysis UseCase 用 ---
      noDailyNote: 'Please open a daily note before running this action',
      llmFailed: 'Failed to execute KPT analysis',
      updated: 'KPT analysis has been updated',
    },
  },

  kpt: {
    outliner: {
      comment: {
        title: 'Shortcut keys (Outliner)',
        body: 'Move lines (Ctrl + Shift + ↑ / ↓), Indent (Tab / Shift + Tab), Delete (Select range → Delete)',
      },
    },
  },
};
