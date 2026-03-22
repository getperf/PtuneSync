// File: src/features/llm_tags/services/note_review/EditableNoteSummary.ts

import { NoteSummary } from 'src/core/models/notes/NoteSummary';

export interface EditableTagItem {
  name: string;
  enabled: boolean;
  isNew: boolean;
}

export interface EditableNoteSummary {
  summary: string;
  tags: EditableTagItem[];
  updateDailyNote: boolean;
  taskKey?: string;

  /** new, new2, new3 ... と追加する */
  addNewTag: () => EditableTagItem;
}

export class EditableNoteSummaryFactory {
  static fromNoteSummary(summary: NoteSummary): EditableNoteSummary {
    const editable: EditableNoteSummary = {
      summary: summary.summary ?? '',
      tags: (summary.tags ?? []).map((t) => ({
        name: t,
        enabled: true,
        isNew: summary.unregisteredTags?.includes(t) ?? false,
      })),
      updateDailyNote: true,
      taskKey: summary.taskKey ?? undefined,

      addNewTag() {
        // UI追加の new/new2/new3 タグだけを対象に連番化
        const newTags = editable.tags.filter((t) => /^new(\d+)?$/.test(t.name));
        const nextIndex = newTags.length + 1;

        const name = nextIndex === 1 ? 'new' : `new${nextIndex}`;
        const newTag: EditableTagItem = {
          name,
          enabled: true,
          isNew: true,
        };

        editable.tags.push(newTag);
        return newTag;
      },
    };

    return editable;
  }
}
