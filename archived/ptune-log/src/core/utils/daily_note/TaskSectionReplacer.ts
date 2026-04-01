// src/core/utils/daily_note/TaskSectionReplacer.ts
import { logger } from 'src/core/services/logger/loggerInstance';

export class TaskSectionReplacer {
  constructor(
    private readonly heading: string,
    private readonly taskMarkdown: string
  ) { }

  replace(markdown: string): string {
    const lines = markdown.split('\n');
    const out: string[] = [];

    const isSectionHeading = (l: string) => /^##\s+/.test(l);
    const isTaskLine = (l: string) => /^\s*-\s*\[[ xX]\]\s+/.test(l);

    let inSection = false;
    let replaced = false;

    for (const line of lines) {
      if (!inSection && line.trim() === this.heading.trim()) {
        inSection = true;
        out.push(line);
        continue;
      }

      if (inSection) {
        if (isSectionHeading(line)) {
          if (!replaced) {
            out.push('', this.taskMarkdown.trim(), '');
            replaced = true;
          }
          inSection = false;
          out.push(line);
          continue;
        }

        if (!replaced && isTaskLine(line)) {
          out.push('', this.taskMarkdown.trim(), '');
          replaced = true;
        }
        continue;
      }

      out.push(line);
    }

    if (inSection && !replaced) {
      out.push('', this.taskMarkdown.trim(), '');
    }

    logger.debug('[TaskSectionReplacer] replaced');
    return out.join('\n').replace(/\n{3,}/g, '\n\n');
  }
}
