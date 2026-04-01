// File: src/features/google_tasks/services/time_analysis/llm/TimeAnalysisPromptBuilder.ts

import { buildTimeAnalysisPrompt } from "./prompt";

export interface TimeAnalysisPromptOptions {
  /** 出力Markdownの見出しレベル（例: 2 -> ##, 4 -> ####） */
  headingLevel?: number;
}

export class TimeAnalysisPromptBuilder {
  buildUserPrompt(yamlText: string, options: TimeAnalysisPromptOptions = {}): string {
    const headingLevel = options.headingLevel ?? 2;

    const header = this.heading(headingLevel);
    return buildTimeAnalysisPrompt({ yamlText, header });
  }

  /** 指定レベルの Markdown 見出しプレフィックスを生成 */
  private heading(level: number): string {
    const safeLevel = Math.min(Math.max(level, 1), 6);
    return '#'.repeat(safeLevel);
  }
}
