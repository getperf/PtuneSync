// src/core/services/daily_notes/parse/DailyNoteParser.ts

import { DailyNote } from 'src/core/models/daily_notes/DailyNote';
import { Section } from 'src/core/models/daily_notes/Section';
import { SectionList } from 'src/core/models/daily_notes/SectionList';
import { HeadingSpecResolver } from './HeadingSpecResolver';

type CurrentSection =
  | {
      kind: 'single';
      ref: 'planned' | 'timelog' | 'reviewMemo' | 'reviewed';
      suffix?: string;
    }
  | { kind: 'list'; ref: 'taskReview' | 'reviewPoint'; suffix?: string }
  | null;

export class DailyNoteParser {
  static parse(raw: string): DailyNote {
    // CRLF/LF を吸収（行末の \r を除去）
    const lines = raw.split('\n').map((l) => l.replace(/\r$/, ''));

    // --- 初期（空定義） ---
    let plannedTask = Section.empty('task.planned');
    let reviewMemo = Section.empty('note.review.memo');
    let reviewedNote = Section.empty('note.report');
    let taskTimelog = Section.empty('task.timelog');
    let taskReviews = new SectionList();
    let reviewPoints = new SectionList();

    let current: CurrentSection = null;
    let buffer: string[] = [];

    const flush = () => {
      if (!current) return;

      // 先頭・末尾の余分な改行を除去（本文のみを保持）
      const body = buffer.join('\n').trim();
      buffer = [];

      if (current.kind === 'single') {
        switch (current.ref) {
          case 'planned':
            plannedTask = plannedTask.withBody(body);
            break;
          case 'timelog':
            taskTimelog = taskTimelog.withBody(body);
            break;
          case 'reviewMemo':
            reviewMemo = reviewMemo.withBody(body);
            break;
          case 'reviewed':
            reviewedNote = reviewedNote.withBody(body);
            break;
        }
      } else {
        if (current.ref === 'taskReview') {
          taskReviews = taskReviews.append(
            Section.fromBody('task.review', body, current.suffix),
          );
        } else {
          reviewPoints = reviewPoints.append(
            Section.fromBody('review.point', body, current.suffix),
          );
        }
      }
    };

    for (const line of lines) {
      const { spec, suffix } = HeadingSpecResolver.resolve(line);
      if (spec?.kind === 'section') {
        // --- 新セクション開始 ---
        flush();

        switch (spec.key) {
          case 'task.planned':
            current = { kind: 'single', ref: 'planned' };
            plannedTask = Section.start('task.planned');
            break;

          case 'note.review.memo':
            current = { kind: 'single', ref: 'reviewMemo' };
            reviewMemo = Section.start('note.review.memo');
            break;

          case 'note.report':
            current = { kind: 'single', ref: 'reviewed', suffix };

            reviewedNote = Section.start('note.report', suffix);
            break;

          case 'task.timelog':
            current = { kind: 'single', ref: 'timelog' };
            taskTimelog = Section.start('task.timelog');
            break;

          case 'task.review':
            current = { kind: 'list', ref: 'taskReview', suffix };
            break;

          case 'review.point':
            current = { kind: 'list', ref: 'reviewPoint', suffix };
            break;

          default:
            current = null;
        }
        continue;
      }

      // fragment / 非見出しは body として保持
      buffer.push(line);
    }

    flush();

    return new DailyNote({
      raw,
      plannedTask,
      taskTimelog,
      taskReviews,
      reviewMemo,
      reviewedNote,
      reviewPoints,
    });
  }
}
