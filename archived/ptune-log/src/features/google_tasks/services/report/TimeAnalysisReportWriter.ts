import { TimeReportTableWriter } from './TimeReportTableWriter';
import { TimeReport } from '../time_analysis/models/TimeReport';
import { TimeReportBacklogWriter } from './TimeReportBacklogWriter';
import { i18n } from 'src/i18n';

export class TimeAnalysisReportWriter {
  private readonly tableWriter = new TimeReportTableWriter();
  private readonly backlogWriter = new TimeReportBacklogWriter();

  write(report: TimeReport, llmResult?: string | null): string {
    const sections: string[] = [];

    // 1) 実績表
    sections.push(this.tableWriter.writeMarkdown(report));

    // 2) 未完了（Backlog）
    const backlog = this.backlogWriter.writeMarkdown(report);
    if (backlog) {
      sections.push('');
      sections.push(backlog);
    }

    // 3) LLM
    if (llmResult) {
      sections.push('');
      // ⏱ 時間分析（LLM）
      sections.push(`#### ${i18n.ui.timeReview.heading.llmAnalysis}`);
      sections.push('');
      sections.push(llmResult);
    }

    return sections.join('\n');
  }
}
