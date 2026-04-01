// src/core/models/daily_notes/reviews/HeadingSpec.ts
import { DailyNoteLabelKey } from '../SectionKey';

export type HeadingKind =
  | 'section' // モデル・Parser が使う
  | 'fragment'; // Writer/Generator 専用（非セクション）

export type HeadingSpec = {
  key: DailyNoteLabelKey;
  kind: HeadingKind;
  level: number;
  emoji?: string;
  parent?: DailyNoteLabelKey;
  repeatable?: boolean;
};

export const TASK_HEADING_SPECS: HeadingSpec[] = [
  {
    key: 'task.planned',
    kind: 'section',
    level: 2,
    emoji: '✅',
  },
  {
    key: 'task.timelog',
    kind: 'section',
    level: 2,
    emoji: '🕒',
  },
  {
    key: 'task.review',
    kind: 'section',
    level: 3,
    parent: 'task.timelog',
    repeatable: true,
  },
  {
    key: 'task.timelog.backlog',
    kind: 'fragment',
    level: 4,
    parent: 'task.review',
    emoji: '📌',
  },
  {
    key: 'task.timelog.analysis',
    kind: 'fragment',
    level: 4,
    parent: 'task.review',
    emoji: '⏱',
  },
];

export const NOTE_HEADING_SPECS: HeadingSpec[] = [
  {
    key: 'note.review.memo',
    kind: 'section',
    level: 2,
    emoji: '🙌',
  },
  {
    key: 'note.tags.daily',
    kind: 'fragment',
    level: 3,
    emoji: '📌',
  },
  {
    key: 'note.tags.unregistered',
    kind: 'fragment',
    level: 3,
    emoji: '⚠',
  },
  {
    key: 'note.report',
    kind: 'section',
    level: 3,
    emoji: '🏷',
  },
  {
    key: 'review.point',
    kind: 'section',
    level: 3,
    emoji: '🧠',
    repeatable: true,
  },
];
