// src/features/tag_merge/ui/views/result/TagMergeRowBuilder.ts

import { App } from 'obsidian';
import { TagSuggestionService } from 'src/features/tags/services/TagSuggestionService';
import { TargetTagEditorDialog } from 'src/core/ui/tags/TargetTagEditorDialog';
import { logger } from 'src/core/services/logger/loggerInstance';
import { TagMergeRowVM } from 'src/features/tag_merge/models/viewmodels/TagMergeRowVM';

export class TagMergeRowBuilder {
  constructor(
    private readonly app: App,
    private readonly tagSuggestionService: TagSuggestionService,
  ) {}

  render(
    container: HTMLElement,
    row: TagMergeRowVM,
    options?: {
      onToggle?: (checked: boolean) => void;
      onEditTo?: () => void;
    },
  ): void {
    const el = container.createDiv({ cls: 'tag-merge-row' });

    const cb = el.createEl('input', { type: 'checkbox' });
    cb.checked = row.checked;

    if (options?.onToggle) {
      cb.addEventListener('change', () => {
        options.onToggle!(cb.checked);
      });
    }

    this.renderFromTo(el, row, options);
    // if (row.isSelf()) {
    //   this.renderToOnly(el, row, options);
    // } else {
    //   this.renderFromTo(el, row, options);
    // }
  }

  private renderToOnly(
    el: HTMLElement,
    row: TagMergeRowVM,
    options?: { onEditTo?: () => void },
  ): void {
    const toLink = el.createEl('a', {
      text: `${row.to}(${row.fromStat.count})`,
      href: '#',
      cls: 'tag-merge-to-link',
    });

    toLink.addEventListener('click', (e) => {
      e.preventDefault();
      options?.onEditTo?.();
    });
  }

  private renderFromTo(
    el: HTMLElement,
    row: TagMergeRowVM,
    options?: { onEditTo?: () => void },
  ): void {
    el.createSpan({
      text: `${row.from}(${row.fromStat.count})`,
      cls: 'tag-merge-from',
    });

    el.createSpan({ text: ' → ', cls: 'tag-merge-arrow' });

    const toLink = el.createEl('a', {
      text: row.to,
      href: '#',
      cls: 'tag-merge-to-link',
    });

    toLink.addEventListener('click', (e) => {
      e.preventDefault();
      options?.onEditTo?.();
    });
  }
}
