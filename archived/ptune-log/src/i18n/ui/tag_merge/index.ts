// src/i18n/ui/tag_merge/index.ts

import type { Lang } from '../../types';
import { tagMergeJa } from './ja';
import { tagMergeEn } from './en';

export function getTagMergeI18n(lang: Lang) {
  switch (lang) {
    case 'en':
      return tagMergeEn;
    case 'ja':
    default:
      return tagMergeJa;
  }
}

export type TagMergeI18n = ReturnType<typeof getTagMergeI18n>;
