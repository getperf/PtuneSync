// File: TaskExecutionKeyFormatter.ts

import { TaskExecutionEntry } from '../models/TaskExecutionEntry';

/**
 * YAML 出力用タスクキー生成
 * - 親あり: 親(子)
 * - 親なし: そのまま
 */
export class TaskExecutionKeyFormatter {
  static toYamlKey(
    entry: TaskExecutionEntry,
    entryMap: Map<string, TaskExecutionEntry>,
  ): string {
    if (!entry.parentTaskKey) {
      return entry.taskKey;
    }

    const parent = entryMap.get(entry.parentTaskKey);
    if (!parent) {
      // 親が解決できない場合はフォールバック
      return entry.taskKey;
    }

    return `${parent.title}(${entry.title})`;
  }
}
