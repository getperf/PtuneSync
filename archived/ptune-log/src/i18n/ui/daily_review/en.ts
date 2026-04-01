// src/i18n/ui/daily_review/en.ts

export const dailyReviewEn = {
  command: {
    runOnFolder: 'Daily review: run for selected folder',
    runOnDate: 'Daily review: run for selected date',
  },

  notice: {
    noMarkdownFiles: 'No Markdown files were found',
    failed: 'An error occurred during the daily review process',
  },

  message: {
    completed: 'Today’s review has been completed',
  },

  modal: {
    title: {
      date: 'Daily Review (Select Date)',
      folder: 'Generate Note Summaries',
    },

    dateSelect: {
      label: 'Target date (analysis & save)',
      description: 'Select from the past 7 days',
    },

    confirm: {
      withCount:
        'Summaries and tags will be added to {count} notes. Do you want to continue?',
    },

    option: {
      /** existing */
      forceRegenerate: {
        label: 'Re-run analysis for already processed notes',
        description:
          'Re-analyze notes with existing summaries or tags using LLM',
      },

      /** added: sentence handling */
      sentenceMode: {
        label: 'Sentence handling',
        description:
          'Choose whether to use note summaries as-is or generate shorter sentences with LLM',
        raw: 'Use as-is (no summarization)',
        llm: 'Summarize sentences with LLM',
      },

      /** added: output format */
      outputFormat: {
        label: 'Note summary output format',
        description:
          'Select the structure of the generated report according to your use case',
        outliner: 'Outliner (collapsible hierarchical view)',
        xmind: 'XMind (mind-map friendly structure)',
      },
    },

    progress: {
      start: 'Processing started ({total} items)',
      processing: 'Processing: {path}',
      finished: 'Finished: {success} succeeded / {errors} failed',
    },
  },
};
