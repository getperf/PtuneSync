// File: src/core/models/tasks/MyTaskFactory.ts
import { MyTask } from './MyTask';
import { PomodoroInfo } from './MyTask/PomodoroInfo';
import { DateUtil } from 'src/core/utils/date/DateUtil';
import { GoogleTaskRaw } from './google/GoogleTaskRaw';
import { MarkdownTaskEntry } from './MarkdownTaskEntry';
import { ReviewFlagNotesCodec } from './MyTask/ReviewFlagNotesCodec';

export class MyTaskFactory {
  static fromGoogleTask(task: GoogleTaskRaw, tasklistId?: string): MyTask {
    // --- reviewFlags ---
    const reviewFlags = ReviewFlagNotesCodec.decode(task.note);

    // --- pomodoro / time ---
    const pomodoroFromNote = this.parsePomodoroInfo(task.note);
    const startedFromNote = this.extractTimestamp('started', task.note);
    const completedFromNote = this.extractTimestamp('completed', task.note);
    const completedFromApi = this.parseDate(task.completed);

    const pomodoro =
      pomodoroFromNote ??
      (task.pomodoro
        ? new PomodoroInfo(
            task.pomodoro.planned ?? 0,
            task.pomodoro.actual ?? 0,
          )
        : undefined);

    const started =
      startedFromNote ??
      (task.started ? this.parseDate(task.started) : undefined);

    const completed =
      completedFromNote ??
      completedFromApi ??
      (task.pomodoro?.actual ? this.parseDate(task.updated) : undefined);

    // --- note 本文（review / pomodoro / time 情報を除外） ---
    const noteBody = this.extractNoteBody(task.note);

    const myTask = new MyTask(
      task.id ?? '',
      task.title ?? '',
      tasklistId,
      noteBody,
      task.parent,
      task.position,
      pomodoro,
      task.status ?? 'needsAction',
      undefined,
      this.parseDate(task.due),
      completed,
      this.parseDate(task.updated),
      started,
      task.deleted ?? false,
    );

    const flags = ReviewFlagNotesCodec.decode(task.note);
    if (flags.size > 0) {
      myTask.reviewFlags = flags;
    }

    return myTask;
  }

  /**
   * 指定キーからUTC時刻文字列（Zなし）を抽出
   */
  private static extractTimestamp(
    key: 'started' | 'completed',
    note?: string,
  ): string | undefined {
    if (!note) return undefined;
    const pattern = new RegExp(`${key}=([^\\s]+)`);
    const match = note.match(pattern);
    return match ? match[1] : undefined;
  }

  private static extractNoteBody(note?: string): string | undefined {
    if (!note) return undefined;

    return (
      ReviewFlagNotesCodec.strip(
        note
          .replace(/🍅x\d+/, '')
          .replace(/✅x[\d.]+/, '')
          .replace(/started=[^\s]+/, '')
          .replace(/completed=[^\s]+/, ''),
      ) || undefined
    );
  }

  private static parsePomodoroInfo(note?: string): PomodoroInfo | undefined {
    if (!note) return undefined;
    const planned = this.extractInt(note, /🍅x(\d+)/) ?? 0;
    const actual = this.extractFloat(note, /✅x([\d.]+)/);
    return planned > 0 ? new PomodoroInfo(planned, actual) : undefined;
  }

  private static extractInt(text: string, pattern: RegExp): number | undefined {
    const match = text.match(pattern);
    return match ? parseInt(match[1], 10) : undefined;
  }

  private static extractFloat(
    text: string,
    pattern: RegExp,
  ): number | undefined {
    const match = text.match(pattern);
    return match ? parseFloat(match[1]) : undefined;
  }

  /** 文字列をUTC ISO文字列に変換 */
  private static parseDate(dateStr?: string): string | undefined {
    return dateStr ? DateUtil.utcString(new Date(dateStr)) : undefined;
  }

  static copyTaskData(source: MyTask, target: MyTask): void {
    if (source.title) target.title = source.title;
    if (source.tasklist_id) target.tasklist_id = source.tasklist_id;
    if (source.note) target.note = source.note;
    if (source.parent) target.parent = source.parent;
    if (source.position) target.position = source.position;

    if (source.reviewFlags && source.reviewFlags.size > 0) {
      target.reviewFlags = new Set(source.reviewFlags);
    }

    if (source.pomodoro) {
      target.pomodoro = new PomodoroInfo(
        source.pomodoro.planned,
        source.pomodoro.actual,
      );
    }

    if (source.status) target.status = source.status;
    if (source.subTasks) target.subTasks = [...source.subTasks];
    if (source.due) target.due = source.due;
    if (source.completed) target.completed = source.completed;
    if (source.updated) target.updated = source.updated;
    if (source.started) target.started = source.started;
    target.deleted = source.deleted;
  }

  /**
   * DailyNoteTaskEntry → MyTask
   */
  static fromDailyNoteTaskEntry(
    parsed: MarkdownTaskEntry,
    taskListName = 'Today',
  ): MyTask {
    const pomodoro =
      parsed.pomodoro && parsed.pomodoro > 0
        ? new PomodoroInfo(parsed.pomodoro)
        : undefined;

    return new MyTask(
      '',
      parsed.title,
      undefined,
      `from: ${taskListName}`,
      undefined,
      undefined,
      pomodoro,
      'needsAction',
      undefined,
      undefined,
      undefined,
      DateUtil.utcString(),
      undefined,
      false,
    );
  }
}
