// src/features/tag_merge/ui/views/result/TagMergeResultView.ts

import { App } from 'obsidian';
import { logger } from 'src/core/services/logger/loggerInstance';
import { TargetTagEditorDialog } from 'src/core/ui/tags/TargetTagEditorDialog';
import { TagSuggestionService } from 'src/features/tags/services/TagSuggestionService';
import { TagMergePriorityGroupVM } from '../../../models/viewmodels/TagMergePriorityGroupVM';
import { TagMergeGroupVM } from '../../../models/viewmodels/TagMergeGroupVM';
import { TagMergeRowVM } from '../../../models/viewmodels/TagMergeRowVM';
import { TagMergePriorityTabs } from './TagMergePriorityTabs';
import { TagMergeRowBuilder } from './TagMergeRowBuilder';

export class TagMergeResultView {
  private activePriorityGroup: TagMergePriorityGroupVM;
  private readonly rowBuilder: TagMergeRowBuilder;
  private bodyEl?: HTMLElement;

  constructor(
    private readonly app: App,
    private readonly priorityGroups: TagMergePriorityGroupVM[],
    private readonly tagSuggestionService: TagSuggestionService,
  ) {
    this.activePriorityGroup = priorityGroups[0];
    this.rowBuilder = new TagMergeRowBuilder(
      this.app,
      this.tagSuggestionService,
    );
  }

  render(container: HTMLElement): void {
    container.empty();
    container.addClass('tag-merge-result-view');

    const tabsEl = container.createDiv();
    new TagMergePriorityTabs(this.priorityGroups, (pg) => {
      this.activePriorityGroup = pg;
      this.renderBodyWithScrollRestore();
    }).render(tabsEl);

    this.bodyEl = container.createDiv({ cls: 'tag-merge-result-body' });
    this.renderBody(this.bodyEl);
  }

  private renderBodyWithScrollRestore(): void {
    if (!this.bodyEl) return;
    const scrollTop = this.bodyEl.scrollTop;
    this.renderBody(this.bodyEl);
    requestAnimationFrame(() => {
      if (this.bodyEl) this.bodyEl.scrollTop = scrollTop;
    });
  }

  private renderBody(container: HTMLElement): void {
    container.empty();
    this.renderPriorityGroup(container, this.activePriorityGroup);
  }

  private renderPriorityGroup(
    container: HTMLElement,
    pg: TagMergePriorityGroupVM,
  ): void {
    if (pg.groups.length === 0) {
      container.createEl('p', { text: '対象なし', cls: 'tag-merge-empty' });
      return;
    }
    for (const group of pg.groups) {
      this.renderGroup(container, group);
    }
  }

  private renderGroup(container: HTMLElement, group: TagMergeGroupVM): void {
    const rows = group.getVisibleRows();

    if (rows.length === 1) {
      this.renderSingleRow(container, rows[0]);
      return;
    }

    const groupEl = container.createDiv({ cls: 'tag-merge-group' });
    const header = groupEl.createDiv({ cls: 'tag-merge-group-header' });

    const cb = header.createEl('input', { type: 'checkbox' });
    cb.checked = group.checked;
    cb.addEventListener('change', () => {
      group.setChecked(cb.checked);
      this.renderBodyWithScrollRestore();
    });

    const toLink = header.createEl('a', {
      text: `${group.to}(${group.toStat.count})`,
      href: '#',
      cls: 'tag-merge-to-link',
    });

    toLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.openGroupToEdit(group);
    });

    const list = groupEl.createDiv({ cls: 'tag-merge-group-list' });
    for (const row of rows) {
      this.rowBuilder.render(list, row, {
        onToggle: (checked) => {
          row.setChecked(checked);
          this.renderBodyWithScrollRestore();
        },
        onEditTo: () => {
          this.openRowToEdit(row);
        },
      });
    }
  }

  private renderSingleRow(container: HTMLElement, row: TagMergeRowVM): void {
    const el = container.createDiv({ cls: 'tag-merge-single-row' });
    this.rowBuilder.render(el, row, {
      onToggle: (checked) => {
        row.setChecked(checked);
        this.renderBodyWithScrollRestore();
      },
      onEditTo: () => {
        this.openRowToEdit(row);
      },
    });
  }

  private openGroupToEdit(group: TagMergeGroupVM): void {
    this.openTagEditDialog(group.to, (newTo) => {
      group.setTo(newTo);
      this.renderBodyWithScrollRestore();
    });
  }

  private openRowToEdit(row: TagMergeRowVM): void {
    this.openTagEditDialog(row.to, (newTo) => {
      row.setTo(newTo);
      this.renderBodyWithScrollRestore();
    });
  }

  private openTagEditDialog(
    initialTo: string,
    onConfirm: (newTo: string) => void,
  ): void {
    logger.debug(`[TagMergeResultView] open edit dialog to=${initialTo}`);

    new TargetTagEditorDialog(this.app, {
      state: { initialInput: initialTo },
      search: this.tagSuggestionService,
      result: {
        confirm: async (value) => {
          if (!value || value === initialTo) return;
          onConfirm(value);
        },
      },
    }).open();
  }
}
