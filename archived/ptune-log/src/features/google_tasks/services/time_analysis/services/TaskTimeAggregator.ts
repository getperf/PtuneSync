// File: src/features/google_tasks/services/time_analysis/services/TaskTimeAggregator.ts

import { MyTask } from 'src/core/models/tasks/MyTask';
import { TimeReport } from '../models/TimeReport';
import { TaskExecutionEntry, PomodoroSum } from '../models/TaskExecutionEntry';
import { TaskKeyGenerator } from 'src/core/services/tasks/TaskKeyGenerator';
import { DateUtil } from 'src/core/utils/date/DateUtil';
import { logger } from 'src/core/services/logger/loggerInstance';

/** 内部用：階層ノード */
interface TaskNode {
  task: MyTask;
  children: TaskNode[];
  sum?: PomodoroSum; // ★ 集計結果を保持
}

export class TaskTimeAggregator {
  aggregate(tasks: MyTask[], date: Date): TimeReport {
    const tree = this.buildHierarchy(tasks.filter((t) => !t.deleted));
    const out = new Map<string, TaskExecutionEntry>();

    // ① 集計（全ノードに sum を設定）
    for (const root of tree) {
      this.aggregateNode(root);
    }

    // ② 出力（親→子順）
    const roots = tree.slice().sort((a, b) => this.sortNode(a, b));
    for (const root of roots) {
      this.emitEntries(root, undefined, out);
    }

    return new TimeReport(DateUtil.localDate(date), 'task_execution', out);
  }

  // --- 親子階層構築
  private buildHierarchy(tasks: MyTask[]): TaskNode[] {
    const map = new Map<string, TaskNode>();
    tasks.forEach((t) => map.set(t.id, { task: t, children: [] }));

    const roots: TaskNode[] = [];
    for (const task of tasks) {
      const node = map.get(task.id);
      if (!node) continue;

      if (task.parent) {
        const parent = map.get(task.parent);
        parent ? parent.children.push(node) : roots.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }

  // --- ノードソート（started → title）
  private sortNode(a: TaskNode, b: TaskNode): number {
    const aKey = a.task.started?.trim() || '9999-12-31T23:59:59Z';
    const bKey = b.task.started?.trim() || '9999-12-31T23:59:59Z';
    const cmp = aKey.localeCompare(bKey);
    return cmp !== 0 ? cmp : a.task.title.localeCompare(b.task.title);
  }

  /**
   * 集計パス
   * - 子→親へ pomodoro ロールアップ
   * - 各 node.sum を必ず設定
   */
  private aggregateNode(node: TaskNode): PomodoroSum {
    const t = node.task;

    let sum: PomodoroSum = {
      planned: t.pomodoro?.planned ?? 0,
      actual: t.pomodoro?.actual ?? 0,
    };

    const children = node.children.slice().sort((a, b) => this.sortNode(a, b));
    for (const child of children) {
      const childSum = this.aggregateNode(child);
      sum.planned += childSum.planned;
      sum.actual += childSum.actual;
    }

    node.sum = sum; // ★ 必ず保存
    return sum;
  }

  /**
   * 出力パス（親→子順）
   */
  private emitEntries(
    node: TaskNode,
    parentTaskKey: string | undefined,
    out: Map<string, TaskExecutionEntry>
  ): void {
    if (!node.sum) {
      logger.error('[TaskTimeAggregator] sum is missing', node.task.title);
      return;
    }

    const selfKey = parentTaskKey
      ? `${parentTaskKey}__${TaskKeyGenerator.normalize(node.task.title)}`
      : TaskKeyGenerator.normalize(node.task.title);

    out.set(
      selfKey,
      TaskExecutionEntry.fromAggregated({
        taskKey: selfKey,
        parentTaskKey,
        task: node.task,
        sum: node.sum,
      })
    );

    const children = node.children.slice().sort((a, b) => this.sortNode(a, b));
    for (const child of children) {
      this.emitEntries(child, selfKey, out);
    }
  }
}
