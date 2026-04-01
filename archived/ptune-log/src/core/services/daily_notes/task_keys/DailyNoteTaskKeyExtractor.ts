// src/core/services/daily_notes/task_keys/DailyNoteTaskKeyExtractor.ts

import {
  TaskKeyGenerator,
  ParsedTask,
} from 'src/core/services/tasks/TaskKeyGenerator';
import { logger } from '../../logger/loggerInstance';

interface ParsedTaskLine {
  indent: number;
  title: string;
  parentTitle?: string;
}

export class DailyNoteTaskKeyExtractor {
  /**
   * plannedTask の raw lines から taskKeys を生成
   */
  async extractFromLines(lines: string[]): Promise<string[]> {
    const parsedLines: ParsedTaskLine[] = [];

    // --- チェックリスト行のみ抽出（既存ロジック維持） ---
    for (const line of lines) {
      const m = line.match(/^(\s*)- \[[ xX]\] (.+)$/);
      if (!m) continue;

      parsedLines.push({
        indent: m[1].length,
        title: m[2].trim(),
      });
    }

    const taskKeys: string[] = [];
    let currentParentTitle: string | undefined;

    // --- 親子判定（既存ロジック維持） ---
    for (const line of parsedLines) {
      if (line.indent === 0) {
        currentParentTitle = line.title;
        line.parentTitle = undefined;
      } else {
        line.parentTitle = currentParentTitle;
      }

      const parsedTask: ParsedTask = {
        title: line.title,
        parentTitle: line.parentTitle,
      };

      taskKeys.push(TaskKeyGenerator.createByParsedTask(parsedTask));
    }

    return taskKeys;
  }
}
