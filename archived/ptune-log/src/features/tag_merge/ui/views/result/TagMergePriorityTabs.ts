// src/features/tag_merge/ui/TagMergePriorityTabs.ts

import { TagMergePriorityGroupVM } from 'src/features/tag_merge/models/viewmodels/TagMergePriorityGroupVM';
import { i18n } from 'src/i18n';

export class TagMergePriorityTabs {
  private activePriority: TagMergePriorityGroupVM;

  constructor(
    private readonly priorityGroups: TagMergePriorityGroupVM[],
    private readonly onSelect: (pg: TagMergePriorityGroupVM) => void,
  ) {
    this.activePriority = priorityGroups[0];
  }

  render(container: HTMLElement): void {
    container.empty();
    container.addClass('tag-merge-priority-tabs');

    const ui = i18n.ui.tagMerge;
    for (const pg of this.priorityGroups) {
      const label = ui.priority?.[pg.priority] ?? pg.priority;
      const title = `${label}(${pg.groups.length})`;

      const tab = container.createDiv({
        cls: 'tag-merge-priority-tab',
        text: title,
      });

      if (pg === this.activePriority) {
        tab.addClass('is-active');
      }

      tab.onclick = () => {
        if (this.activePriority === pg) return;

        this.activePriority = pg;
        this.render(container);
        this.onSelect(pg);
      };
    }
  }
}
