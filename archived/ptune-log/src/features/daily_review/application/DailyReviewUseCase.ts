// File: src/features/daily_review/application/DailyReviewUseCase.ts

import { App, Notice, TFolder } from 'obsidian';
import { DailyReviewModal } from '../presentation/ui/DailyReviewModal';
import { NoteAnalysisRunner } from '../../../core/services/llm/note_analysis/NoteAnalysisRunner';
import { ReviewSettings } from 'src/config/settings/ReviewSettings';
import { LLMClient } from 'src/core/services/llm/client/LLMClient';
import { NoteAnalysisPromptService } from 'src/core/services/llm/note_analysis/NoteAnalysisPromptService';
import { DailyReviewApplier } from '../infrastructure/note_summary/DailyReviewApplier';
import { DailyNoteSummaryUseCase } from './note_summary/DailyNoteSummaryUseCase';
import { DailyReviewRunOptions } from './DailyReviewRunOptions';
import { logger } from 'src/core/services/logger/loggerInstance';
import { i18n } from 'src/i18n';

export class DailyReviewUseCase {
  constructor(
    private readonly app: App,
    private readonly client: LLMClient,
    private readonly runner: NoteAnalysisRunner,
    private readonly reviewSettings: ReviewSettings,
  ) {}

  async runOnFolder(folder: TFolder): Promise<void> {
    logger.info('[DailyReview] runOnFolder start', { folder: folder.path });

    if (!this.client.hasValidApiKey()) {
      new Notice(`⚠️ ${i18n.ui.shared.notice.apiKeyNotSet}`);
      return;
    }

    const files = this.runner.findFilesInFolder(folder);
    if (!files.length) {
      new Notice(`⚠️ ${i18n.ui.dailyReview.notice.noMarkdownFiles}`);
      return;
    }

    const prompt = await NoteAnalysisPromptService.build(this.app);

    const modal = new DailyReviewModal(this.app, {
      mode: 'folder',
      initialFiles: files,
      onConfirm: async (modal, files, _date, options) => {
        await this.execute(files, new Date(), prompt, modal, options);
        modal.close();
      },
    });

    modal.open();
  }

  async runOnDate(): Promise<void> {
    logger.info('[DailyReview] runOnDate start');

    if (!this.client.hasValidApiKey()) {
      new Notice(`⚠️ ${i18n.ui.shared.notice.apiKeyNotSet}`);
      return;
    }

    const initialDate = new Date();
    const initialFiles = await this.runner.findFilesByDate(initialDate);
    const prompt = await NoteAnalysisPromptService.build(this.app);

    const modal = new DailyReviewModal(this.app, {
      mode: 'date',
      initialDate,
      initialFiles,
      onDateChange: (date) => this.runner.findFilesByDate(date),
      onConfirm: async (modal, files, selectedDate, options) => {
        await this.execute(files, selectedDate, prompt, modal, options);
        modal.showCompletionMessage(
          `✅ ${i18n.ui.dailyReview.message.completed}`,
        );
        setTimeout(() => modal.close(), 1500);
      },
    });

    modal.open();
  }

  private async execute(
    files: any[],
    date: Date,
    prompt: string,
    modal: DailyReviewModal,
    options: DailyReviewRunOptions,
  ): Promise<void> {
    const applier = new DailyReviewApplier(this.app, this.reviewSettings);
    const reportUseCase = new DailyNoteSummaryUseCase(
      this.app,
      this.client,
      this.reviewSettings,
    );

    try {
      const summaries = await this.runner.runOnFiles(
        files,
        prompt,
        modal,
        options.forceRegenerate,
      );

      // ★ SettingTab の既定値を使用
      const reportMd = await reportUseCase.execute(summaries);

      await applier.apply(date, summaries, reportMd);
    } catch (e) {
      logger.error('[DailyReview] execute failed', e);
      new Notice(`⚠️ ${i18n.ui.dailyReview.notice.failed}`);
    }
  }
}
