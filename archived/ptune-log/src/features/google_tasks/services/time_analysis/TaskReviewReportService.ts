// File: src/features/google_tasks/services/time_analysis/TaskReviewReportService.ts

import { Plugin } from 'obsidian';
import { GoogleTasksCommandUtil } from '../../utils/GoogleTasksCommandUtil';
import { GoogleTasksAPI } from '../../utils/GoogleTasksAPI';
import type { GoogleAuthSettings } from 'src/config/ConfigManager';

import { TaskExecutionLoader } from '../time_analysis/services/TaskExecutionLoader';
import { TaskTimeAggregator } from '../time_analysis/services/TaskTimeAggregator';
import { TimeReportYamlWriter } from '../time_analysis/services/TimeReportYamlWriter';
import { LLMTimeAnalysisService } from '../time_analysis/services/LLMTimeAnalysisService';

import { WinTaskImportSource } from '../import/WinTaskImportSource';
import { ApiTaskImportSource } from '../import/ApiTaskImportSource';
import { TaskNoteRelationService } from './services/TaskNoteRelationService';
import { MyTask } from 'src/core/models/tasks/MyTask';
import { TaskJsonUtils } from 'src/core/utils/task/TaskJsonUtils';
import { TaskReviewAnalysisService } from './services/TaskReviewAnalysisService';
import { DailyNoteLoader } from 'src/core/services/daily_notes/file_io/DailyNoteLoader';
import { DailyNoteWriter } from 'src/core/services/daily_notes/file_io/DailyNoteWriter';
import { DateUtil } from 'src/core/utils/date/DateUtil';
import { LLMClient } from 'src/core/services/llm/client/LLMClient';
import { logger } from 'src/core/services/logger/loggerInstance';
import { TaskReviewDateResolver } from './services/TaskReviewDateResolver';
import { TodayTaskImporter } from '../import/TodayTaskImporter';

export type TaskReviewStatus =
  | 'idle'
  | 'importing'
  | 'loading'
  | 'aggregating'
  | 'attaching-notes'
  | 'writing'
  | 'llm-analyzing'
  | 'completed'
  | 'error';

export interface TaskReviewStatusListener {
  onStatusChange(status: TaskReviewStatus, message?: string): void;
}

export interface TaskReviewOptions {
  enableImport?: boolean;
  enableLLMAnalysis?: boolean;
  statusListener?: TaskReviewStatusListener;
}

export class TaskReviewReportService {
  private readonly app = this.plugin.app;

  private readonly loader = new TaskExecutionLoader(this.app);
  private readonly aggregator = new TaskTimeAggregator();
  private readonly writer = new TimeReportYamlWriter(this.app);
  private readonly noteRelation = new TaskNoteRelationService(this.app);
  private readonly llmAnalysis?: LLMTimeAnalysisService;

  constructor(
    private readonly plugin: Plugin,
    private readonly settings: GoogleAuthSettings,
    llmClient?: LLMClient,
  ) {
    if (llmClient) {
      this.llmAnalysis = new LLMTimeAnalysisService(this.app, llmClient);
    }
  }

  /** GoogleTasks API 実行を Service 内に集約 */
  private async withApi(
    fn: (api: GoogleTasksAPI) => Promise<void>,
  ): Promise<void> {
    return GoogleTasksCommandUtil.wrap(this.plugin, this.settings, fn)();
  }

  /** 振り返り実行（単一入口） */
  async generate(date: Date, options: TaskReviewOptions): Promise<void> {
    const notify = options.statusListener?.onStatusChange;
    const saver = new TaskJsonUtils(this.app);

    // --- 日付モード判定 ---
    notify?.('loading', '日付を確認中');
    const mode = await TaskReviewDateResolver.resolve(date, saver);

    // --- 今日のみ import + save ---
    if (mode === 'today-import') {
      notify?.('importing', '今日のタスクを取得中');

      const importer = new TodayTaskImporter(
        this.app,
        this.plugin,
        this.settings,
      );

      const tasks = await importer.import();
      await saver.save(tasks, date);
    }

    // --- 過去日で未保存はエラー（仕様化は保留） ---
    if (mode === 'past-missing') {
      notify?.('error', '過去日のタスクデータが見つかりません');
      throw new Error(`Task JSON not found for ${DateUtil.localDate(date)}`);
    }

    // --- 分析（常にローカル JSON 起点） ---
    notify?.('aggregating', '時間分析中');

    const analysis = new TaskReviewAnalysisService(this.app, this.llmAnalysis);
    const enableLLM = options.enableLLMAnalysis ?? false;
    const result = await analysis.analyze(date, enableLLM);

    // --- DailyNote 更新 ---
    const dailyNote = await DailyNoteLoader.load(this.app, date);
    const updated = dailyNote.appendTaskReview(
      result.markdown,
      `(${DateUtil.localTime()})`,
      'first',
    );

    const writer = new DailyNoteWriter(this.app);
    await writer.write(updated, date);

    notify?.('completed', '完了');
  }
}
