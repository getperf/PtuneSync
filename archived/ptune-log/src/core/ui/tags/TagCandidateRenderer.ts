// File: src/core/ui/tags/TagCandidateRenderer.ts

import { TagCandidate } from 'src/core/models/tags/TagCandidate';
import { logger } from 'src/core/services/logger/loggerInstance';

export class TagCandidateRenderer {
  constructor(
    private readonly container: HTMLElement,
    private readonly onSelect: (name: string) => void
  ) {}

  render(candidates: TagCandidate[]): void {
    this.container.empty();

    if (candidates.length === 0) {
      this.container.createEl('div', {
        text: '候補が見つかりません',
        cls: 'tag-candidate-empty',
      });
      logger.debug('[TagCandidateRenderer] empty');
      return;
    }

    for (const c of candidates) {
      const label =
        typeof c.score === 'number'
          ? `${c.name} (${c.count}, ${c.score.toFixed(3)})`
          : `${c.name} (${c.count})`;

      const item = this.container.createEl('div', {
        text: label,
        cls: 'tag-candidate-item',
      });

      item.addEventListener('click', () => {
        logger.debug(`[TagCandidateRenderer] select=${c.name}`);
        this.onSelect(c.name);
      });
    }
  }
}
