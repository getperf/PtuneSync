// src/features/google_tasks/services/time_analysis/TaskReviewAnalysisService.ts

import { App } from 'obsidian';
import { TaskExecutionLoader } from './TaskExecutionLoader';
import { TaskTimeAggregator } from './TaskTimeAggregator';
import { TimeReportYamlWriter } from './TimeReportYamlWriter';
import { TaskNoteRelationService } from './TaskNoteRelationService';
import { LLMTimeAnalysisService } from './LLMTimeAnalysisService';
import { TimeAnalysisReportWriter } from '../../report/TimeAnalysisReportWriter';

export interface TaskReviewResult {
  date: string;
  markdown: string;
  yamlPath: string;
  llmResult?: string | null;
}

export class TaskReviewAnalysisService {
  private readonly loader: TaskExecutionLoader;
  private readonly aggregator = new TaskTimeAggregator();
  private readonly yamlWriter: TimeReportYamlWriter;
  private readonly noteRelation: TaskNoteRelationService;
  private readonly llmAnalysis?: LLMTimeAnalysisService;

  constructor(app: App, llmAnalysis?: LLMTimeAnalysisService) {
    this.loader = new TaskExecutionLoader(app);
    this.yamlWriter = new TimeReportYamlWriter(app);
    this.noteRelation = new TaskNoteRelationService(app);
    this.llmAnalysis = llmAnalysis;
  }

  async analyze(date: Date, enableLLM: boolean): Promise<TaskReviewResult> {
    const execTasks = await this.loader.load(date);

    const report = this.aggregator.aggregate(execTasks, date);
    await this.noteRelation.attachRelatedNotes(report, date);

    const yamlPath = await this.yamlWriter.write(report);

    let llmResult: string | null = null;
    if (enableLLM && this.llmAnalysis) {
      llmResult = await this.llmAnalysis.analyzeFromYamlFile(yamlPath);
    }

    const markdown = new TimeAnalysisReportWriter().write(report, llmResult);

    return {
      date: report.date,
      markdown,
      yamlPath,
      llmResult,
    };
  }
}
