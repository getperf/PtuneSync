// File: src/features/google_tasks/services/report/TimeReportBacklogWriter.ts

import { TimeReport } from '../time_analysis/models/TimeReport';
import { TaskExecutionEntry } from '../time_analysis/models/TaskExecutionEntry';
import { i18n } from 'src/i18n';

type EntryNode = {
  entry: TaskExecutionEntry;
  children: EntryNode[];
};

export class TimeReportBacklogWriter {
  writeMarkdown(report: TimeReport): string {
    const roots = this.buildTree(report);

    const lines: string[] = [];
    for (const root of roots) {
      this.walk(root, 0, lines);
    }

    if (lines.length === 0) return '';
    // 未完了タスク
    return `#### ${i18n.ui.timeReview.heading.backlog}\n${lines.join('\n')}`;
  }

  private buildTree(report: TimeReport): EntryNode[] {
    const nodeMap = new Map<string, EntryNode>();
    const roots: EntryNode[] = [];

    // report.tasks の順序を維持
    const entries = Array.from(report.tasks.values());

    for (const e of entries) {
      nodeMap.set(e.taskKey, { entry: e, children: [] });
    }

    for (const e of entries) {
      const node = nodeMap.get(e.taskKey);
      if (!node) continue;

      if (e.parentTaskKey) {
        const parent = nodeMap.get(e.parentTaskKey);
        if (parent) parent.children.push(node);
        else roots.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  private walk(node: EntryNode, level: number, out: string[]): void {
    const e = node.entry;

    // 未完了のみ backlog 対象
    if (e.status !== 'completed') {
      const indent = '\t'.repeat(level);
      const plannedSuffix = this.formatPlanned(e);
      out.push(`${indent}- [ ] ${e.title}${plannedSuffix}`);
    }

    for (const child of node.children) {
      this.walk(child, level + 1, out);
    }
  }

  private formatPlanned(entry: TaskExecutionEntry): string {
    const planned = entry.pomodoro?.planned;

    // 0 / undefined は表示しない
    if (!planned || planned <= 0) return '';

    // planned は 2.0 のような小数の可能性があるため、表示ルールを固定
    // - 整数ならそのまま
    // - 小数なら 1 桁で表示（🍅x1.5 など）
    const isInt = Number.isInteger(planned);
    const n = isInt ? String(planned) : planned.toFixed(1);

    return `🍅x${n}`;
  }
}
