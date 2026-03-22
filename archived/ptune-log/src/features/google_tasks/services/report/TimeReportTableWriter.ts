import { i18n } from 'src/i18n';
import { TaskExecutionEntry } from '../time_analysis/models/TaskExecutionEntry';
import { TimeReport } from '../time_analysis/models/TimeReport';
import { DateUtil } from 'src/core/utils/date/DateUtil';

export class TimeReportTableWriter {
  writeMarkdown(report: TimeReport): string {
    const lines: string[] = [];

    const t = i18n.ui.timeReview;
    // タイムテーブル
    lines.push(`#### ${t.heading.timeTable}`);
    // | 状態 | タイトル | 計画🍅 | 実績✅ | 開始 | 完了 |
    lines.push(
      `| ${t.table.status} | ` +
        `${t.table.title} | ` +
        `${t.table.planned} | ` +
        `${t.table.actual} | ` +
        `${t.table.started} | ` +
        `${t.table.completed} |`
    );
    lines.push('| --- | --- | --- | --- | --- | --- |');

    for (const entry of report.tasks.values()) {
      lines.push(this.renderRow(entry));
    }

    return lines.join('\n');
  }

  private renderRow(entry: TaskExecutionEntry): string {
    const status = entry.status === 'completed' ? '✅' : '';
    const indent = entry.parentTaskKey ? '&nbsp;&nbsp;&nbsp;&nbsp;' : '';
    const title = `${indent}${entry.title}`;

    const planned = DateUtil.formatDecimal(entry.pomodoro?.planned);
    const actual = DateUtil.formatDecimal(entry.pomodoro?.actual);

    const started = DateUtil.toTimeHM(entry.started);
    const completed = DateUtil.toTimeHM(entry.completed);

    return `| ${status} | ${title} | ${planned} | ${actual} | ${started} | ${completed} |`;
  }
}
