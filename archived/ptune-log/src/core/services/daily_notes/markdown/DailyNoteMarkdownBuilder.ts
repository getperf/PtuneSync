// src/core/services/daily_notes/markdown/DailyNoteMarkdownBuilder.ts

import { DailyNote } from 'src/core/models/daily_notes/DailyNote';
import { Section } from 'src/core/models/daily_notes/Section';
import { HeadingBuilder } from 'src/core/utils/daily_note/HeadingBuilder';

export class DailyNoteMarkdownBuilder {
  static build(note: DailyNote): string {
    const out: string[] = [];

    // --- 今日の予定タスク ---
    this.writeSingleSection(out, note.plannedTask);

    // --- タイムログ（単一） ---
    this.writeSingleSection(out, note.taskTimelog);

    // --- タスク振り返り（複数） ---
    for (const section of note.taskReviews.sections) {
      this.writeSingleSection(out, section);
    }

    // --- 振り返りメモ ---
    this.writeSingleSection(out, note.reviewMemo);

    // --- デイリーレポート ---
    this.writeSingleSection(out, note.reviewedNote);

    // --- KPT ---
    for (const section of note.reviewPoints.sections) {
      this.writeSingleSection(out, section);
    }

    // 末尾改行は 1 行に正規化
    return out.join('\n').trimEnd() + '\n';
  }

  private static writeSingleSection(out: string[], section: Section): void {
    // 元ノートに存在しないセクションは出力しない
    if (!section.present) return;

    out.push(HeadingBuilder.create(section.key, { suffix: section.suffix }));

    out.push('');
    if (section.hasContent()) {
      out.push(section.body.trimEnd());
    }
    out.push('');
  }
}
