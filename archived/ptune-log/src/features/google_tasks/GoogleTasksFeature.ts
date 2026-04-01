// File: src/features/google_tasks/GoogleTasksFeature.ts

import { Plugin, Notice, App, TFile } from 'obsidian';
import type { GoogleAuthSettings } from '../../config/ConfigManager';
import { GoogleTasksAPI } from './utils/GoogleTasksAPI';
import { GoogleTasksCommandUtil } from 'src/features/google_tasks/utils/GoogleTasksCommandUtil';
import { logger } from 'src/core/services/logger/loggerInstance';
import { DailyNoteConfig } from 'src/core/utils/daily_note/DailyNoteConfig';
import { TasksWinReauth } from './win/TasksWinReauth';
import { GoogleAuth } from './google_auth/GoogleAuth';
import { GoogleTasksExportModal } from './win/GoogleTasksExportModal';
import { GetTasksMarkdownExecutor } from './win/GetTasksMarkdownExecutor';
import { GoogleTasksDailyNoteTaskKeyUpdater } from './services/dailynote/GoogleTasksDailyNoteTaskKeyUpdater';
import { TasksExport } from './services/export/TasksExport';
import { TimeReportDateSelectModal } from './services/time_analysis/ui/TimeReportDateSelectModal';
import { LLMSettings } from 'src/config/settings/LLMSettings';
import { TaskReviewReportService } from './services/time_analysis/TaskReviewReportService';
import { LLMClient } from 'src/core/services/llm/client/LLMClient';

export class GoogleTasksFeature {
  private readonly app: App;
  reviewService: TaskReviewReportService;
  llmClient: LLMClient;

  constructor(
    private readonly plugin: Plugin,
    private readonly settings: GoogleAuthSettings,
    private readonly llmSettings: LLMSettings
  ) {
    this.app = plugin.app;
    this.llmClient = new LLMClient(this.app, this.llmSettings);
    this.reviewService = new TaskReviewReportService(
      this.plugin,
      this.settings,
      this.llmClient
    );
  }

  /* =========================
   * 共通：taskKeys 後処理更新
   * ========================= */
  private async updateTaskKeys(): Promise<void> {
    const service = new GoogleTasksDailyNoteTaskKeyUpdater(this.app);
    const result = await service.execute();
    logger.info(
      `[GoogleTasksFeature] taskKeys updated (${result.taskKeys.length})`
    );
  }

  /* =========================
   * デイリーノート → Google Tasks
   * ========================= */
  private async exportFromDaily(api: GoogleTasksAPI): Promise<void> {
    const path = await DailyNoteConfig.getDailyNotePath(this.app.vault);
    if (!path) {
      new Notice('今日のデイリーノートが見つかりません');
      return;
    }

    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) {
      new Notice('デイリーノートが無効です');
      return;
    }

    const exporter = new TasksExport(this.app, file, api);
    await exporter.confirmAndRun();
  }

  /* =========================
   * コマンド登録
   * ========================= */
  regist(): void {
    /* --- Google OAuth 再認証 --- */
    this.plugin.addCommand({
      id: 'gtasks-reset-auth',
      name: 'Google Tasks: Google認証をやり直す',
      callback: async () => {
        if (this.settings.useWinApp) {
          await new TasksWinReauth(this.app).execute();
        } else {
          const auth = new GoogleAuth(this.plugin, this.settings);
          const ok = await auth.reauthorize();
          new Notice(ok ? '認証成功しました' : '認証に失敗しました');
        }
      },
    });

    /* --- 今日の予定タスク取得（PtuneSync） --- */
    this.plugin.addCommand({
      id: 'gtasks-get-tasks-md',
      name: 'Google Tasks: 今日の予定タスクを取得（PtuneSync）',
      callback: async () => {
        if (!this.settings.useWinApp) return;

        // ① 外部処理
        await new GetTasksMarkdownExecutor(this.app).execute();

        // ② 後処理（共通）
        await this.updateTaskKeys();
      },
    });

    /* --- デイリーノート → Google Tasks エクスポート --- */
    this.plugin.addCommand({
      id: 'gtasks-export-from-daily',
      name: 'Google Tasks: デイリーノートからタスクエクスポート',
      callback: async () => {
        if (this.settings.useWinApp) {
          new GoogleTasksExportModal(this.app).open();
        } else {
          await GoogleTasksCommandUtil.wrap(
            this.plugin,
            this.settings,
            async (api) => {
              await this.exportFromDaily(api);
            }
          )();
        }

        // 後処理（共通）
        await this.updateTaskKeys();
      },
    });

    /* --- Google Tasks → デイリーノート（振り返り） --- */
    this.plugin.addCommand({
      id: 'gtasks-import-to-note',
      name: 'Google Tasks: タスクの振り返りレポート',
      callback: () => {
        new TimeReportDateSelectModal(this.app, async (date, modalOptions) => {
          await this.reviewService.generate(date, modalOptions);
        }).open();
      },
    });
  }
}
