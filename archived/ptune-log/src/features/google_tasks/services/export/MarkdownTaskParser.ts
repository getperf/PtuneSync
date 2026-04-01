import { MarkdownTaskEntry } from 'src/core/models/tasks/MarkdownTaskEntry';
import { logger } from 'src/core/services/logger/loggerInstance';

/**
 * Markdown 形式のタスク一覧を解析し、ParsedTask オブジェクト配列に変換するクラス
 */
export class MarkdownTaskParser {
  /**
   * タスク行を解析して ParsedTask[] を返す（親子関係をインデントで判定）
   */
  static parse(lines: string[]): MarkdownTaskEntry[] {
    const taskRe = /^\s*-\s\[\s\]\s+(.*?)(?:\s*🍅x?(\d+))?$/;
    const result: MarkdownTaskEntry[] = [];
    let currentParentIndex: number | null = null;

    for (const [i, line] of lines.entries()) {
      const match = line.match(taskRe);
      if (!match) continue;

      const title = match[1].trim();
      if (!title) continue;

      const pomodoro = match[2] ? parseInt(match[2]) : 0;
      const indent = line.search(/\S|$/);

      const task: MarkdownTaskEntry = {
        index: i,
        title,
        pomodoro,
        rawLine: line,
      };

      if (indent > 0 && currentParentIndex !== null) {
        task.parent_index = currentParentIndex;
      } else {
        currentParentIndex = i;
      }

      result.push(task);
    }

    logger.debug(`[MarkdownTaskParser.parse] parsed=${result.length}`);
    return result;
  }
}
