// src/task-io/transforms/markdown/MarkdownTaskListParser.ts

import { ParsedTaskNode } from "../../../../domain/task/dto/ParsedTaskNode";
import { TaskLineMetaParser } from "./TaskLineMetaParser";
import { TaskListMdastExtractor } from "./TaskListMdastExtractor";

export class MarkdownTaskListParser {
  static parse(body: string): ParsedTaskNode[] {
    const mdastLines = TaskListMdastExtractor.extract(body);

    const nodes: ParsedTaskNode[] = [];
    const stack: { depth: number; title: string }[] = [];

    for (const line of mdastLines) {
      const meta = TaskLineMetaParser.parse(line.rawText);

        // depth調整
      while (stack.length > 0) {
        const last = stack[stack.length - 1]!;
        if (last.depth >= line.depth) {
          stack.pop();
          continue;
        }
        break;
      }

      const parentTitle = stack.length > 0 ? stack[stack.length - 1]!.title : null;

      nodes.push({
        title: meta.title,
        parentTitle,
        pomodoroPlanned: meta.pomodoroPlanned,
        tags: meta.tags,
        goal: meta.goal,
      });

      stack.push({ depth: line.depth, title: meta.title });
    }
    return nodes;
  }
}
