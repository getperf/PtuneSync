// src/features/tag_merge/services/detectors/VariantPriorityDetector.ts

import { TagMergePriorityDetector } from './TagMergePriorityDetector';
import { normalizeTagForCompare } from 'src/core/utils/tag/normalizeTag';

export class VariantPriorityDetector implements TagMergePriorityDetector {
  detect(to: string, from: string): boolean {
    if (from === to) return false;

    const normTo = normalizeTagForCompare(to);
    const normFrom = normalizeTagForCompare(from);

    return normFrom === normTo;
  }
}
