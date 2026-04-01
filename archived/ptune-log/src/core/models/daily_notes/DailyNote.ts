// src/core/models/daily_notes/DailyNote.ts

import { DailyNoteMarkdownBuilder } from 'src/core/services/daily_notes/markdown/DailyNoteMarkdownBuilder';
import { Section } from './Section';
import { SectionList } from './SectionList';

export class DailyNote {
  /** 元ノートの生Markdown（解析ソース） */
  readonly raw: string;

  /** 対象日付（既定：生成時点） */
  readonly date: Date;

  /** 今日の予定タスク */
  readonly plannedTask: Section;

  /** タイムログ（単一） */
  readonly taskTimelog: Section;

  /** タスク振り返り（複数） */
  readonly taskReviews: SectionList;

  /** 振り返りメモ */
  readonly reviewMemo: Section;

  /** デイリーレポート */
  readonly reviewedNote: Section;

  /** 振り返りポイント（複数） */
  readonly reviewPoints: SectionList;

  constructor(params: {
    raw: string;
    date?: Date;
    plannedTask: Section;
    taskTimelog: Section;
    taskReviews?: SectionList;
    reviewMemo: Section;
    reviewedNote: Section;
    reviewPoints?: SectionList;
  }) {
    this.raw = params.raw;
    this.date = params.date ?? new Date();

    this.plannedTask = params.plannedTask;
    this.taskTimelog = params.taskTimelog;
    this.taskReviews = params.taskReviews ?? new SectionList();

    this.reviewMemo = params.reviewMemo;
    this.reviewedNote = params.reviewedNote;
    this.reviewPoints = params.reviewPoints ?? new SectionList();
  }

  /** Parser 用ファクトリ */
  static fromParsed(params: {
    raw: string;
    date?: Date;
    plannedTask: Section;
    taskTimelog: Section;
    taskReviews?: SectionList;
    reviewMemo: Section;
    reviewedNote: Section;
    reviewPoints?: SectionList;
  }): DailyNote {
    return new DailyNote(params);
  }

  /* ---------- Immutable Update APIs ---------- */

  updatePlannedTask(markdown: string): DailyNote {
    return new DailyNote({
      ...this,
      plannedTask: this.plannedTask.replaceBody(markdown),
    });
  }

  updateTaskTimelog(markdown: string): DailyNote {
    return new DailyNote({
      ...this,
      taskTimelog: this.taskTimelog.replaceBody(markdown),
    });
  }

  appendTaskReview(
    markdown: string,
    suffix?: string,
    position: 'first' | 'last' = 'last',
  ): DailyNote {
    return new DailyNote({
      ...this,
      taskReviews: this.taskReviews.insert(
        Section.fromBody('task.review', markdown, suffix),
        position,
      ),
    });
  }

  updateReviewMemo(markdown: string): DailyNote {
    return new DailyNote({
      ...this,
      reviewMemo: this.reviewMemo.replaceBody(markdown),
    });
  }

  appendReviewMemo(markdown: string): DailyNote {
    return new DailyNote({
      ...this,
      reviewMemo: this.reviewMemo.appendBody(markdown),
    });
  }

  updateReviewedNote(markdown: string): DailyNote {
    return new DailyNote({
      ...this,
      reviewedNote: this.reviewedNote.replaceBody(markdown),
    });
  }

  appendReviewPoint(
    markdown: string,
    suffix?: string,
    position: 'first' | 'last' = 'last',
  ): DailyNote {
    return new DailyNote({
      ...this,
      reviewPoints: this.reviewPoints.insert(
        Section.fromBody('review.point', markdown, suffix),
        position,
      ),
    });
  }

  /** Markdown 生成（保存用） */
  toMarkdown(): string {
    return DailyNoteMarkdownBuilder.build(this);
  }
}
