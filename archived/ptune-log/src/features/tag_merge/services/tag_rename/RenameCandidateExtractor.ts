// File: src/features/tag_merge/services/tag_rename/RenameCandidateExtractor.ts

import { App } from 'obsidian';
import { RenameCandidateRow } from './models/RenameCandidateRow';
import { TagMergePriorityGroupVM } from '../../models/viewmodels/TagMergePriorityGroupVM';
import { DebugViewModal } from '../../ui/utils/DebugViewModal';

export class RenameCandidateExtractor {
  constructor(private readonly app: App) {}

  extract(
    priorityGroups: TagMergePriorityGroupVM[],
    opts?: {
      debug?: boolean;
    },
  ): RenameCandidateRow[] {
    const candidates: RenameCandidateRow[] = [];

    for (const priorityGroup of priorityGroups) {
      const priority = priorityGroup.priority;

      for (const group of priorityGroup.groups) {
        const to = group.to;

        for (const row of group.rows) {
          if (!row.checked) continue;
          if (row.isSelf()) continue;

          candidates.push({
            from: row.from,
            to,
            priority,
          });
        }
      }
    }

    if (opts?.debug) {
      const json = JSON.stringify(candidates, null, 2);
      new DebugViewModal(this.app, 'Rename Candidates (Debug)', json).open();
    }

    return candidates;
  }
}
