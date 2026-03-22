// src/features/tag_merge/services/detectors/HierarchyPriorityDetector.ts

import { TagMergePriorityDetector } from './TagMergePriorityDetector';
import { normalizeTagForCompare } from 'src/core/utils/tag/normalizeTag';

export class HierarchyPriorityDetector implements TagMergePriorityDetector {
  detect(to: string, from: string): boolean {
    if (from === to) return false;

    const toLeaf = this.getLeaf(to);
    const fromLeaf = this.getLeaf(from);

    // ① 末尾ワードが完全一致
    if (fromLeaf === toLeaf) {
      return true;
    }

    // ② 正規化後に一致（表記ゆれ考慮）
    const normTo = normalizeTagForCompare(toLeaf);
    const normFrom = normalizeTagForCompare(fromLeaf);

    if (normFrom === normTo) {
      return true;
    }

    return false;
  }

  private getLeaf(tag: string): string {
    const parts = tag.split('/');
    return parts[parts.length - 1];
  }
}
