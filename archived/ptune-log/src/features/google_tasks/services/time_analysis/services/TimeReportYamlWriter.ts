// File: src/features/google_tasks/services/time_analysis/services/TimeReportYamlWriter.ts

import { App, normalizePath, stringifyYaml } from 'obsidian';
import { TimeReport } from '../models/TimeReport';
import { logger } from 'src/core/services/logger/loggerInstance';
import { TaskExecutionKeyFormatter } from '../utils/TaskExecutionKeyFormatter';

export class TimeReportYamlWriter {
  static readonly BASE_DIR = '_journal/meta';

  constructor(private readonly app: App) {}

  async write(report: TimeReport): Promise<string> {
    const fileName = `task_execution_${report.date}.yaml`;
    const path = normalizePath(`${TimeReportYamlWriter.BASE_DIR}/${fileName}`);

    const adapter = this.app.vault.adapter;
    if (!(await adapter.exists(TimeReportYamlWriter.BASE_DIR))) {
      await adapter.mkdir(TimeReportYamlWriter.BASE_DIR);
    }

    const payload = {
      date: report.date,
      source: report.source,
      tasks: Object.fromEntries(
        [...report.tasks.entries()].map(([key, e]) => {
          const yamlKey = TaskExecutionKeyFormatter.toYamlKey(e, report.tasks);

          return [
            yamlKey,
            {
              status: e.status,
              pomodoro: e.pomodoro,
              reviewFlags: e.reviewFlags
                ? Array.from(e.reviewFlags)
                : undefined,
              relatedNotes: e.relatedNotes,
            },
          ];
        }),
      ),
    };

    await adapter.write(path, stringifyYaml(payload));
    logger.info(`[TimeReportYamlWriter] saved -> ${path}`);
    return path;
  }
}
