// File: src/core/utils/task/TaskJsonUtils.ts
import { App, normalizePath } from 'obsidian';
import { logger } from 'src/core/services/logger/loggerInstance';
import { MyTask } from 'src/core/models/tasks/MyTask';
import { MyTaskFactory } from 'src/core/models/tasks/MyTaskFactory';
import { DateUtil } from 'src/core/utils/date/DateUtil';
import { GoogleTaskRaw } from 'src/core/models/tasks/google/GoogleTaskRaw';
import { ReviewFlag } from 'src/core/models/tasks/MyTask/ReviewFlag';

/**
 * JSONファイル内のタスク構造を型で保証
 * ※ 永続化形式は Array を維持（Set はJSON化不可）
 */
export interface TaskJsonRecord {
  id: string;
  title: string;
  parent: string | null;
  pomodoro: {
    planned: number | null;
    actual: number | null;
  };
  status: 'needsAction' | 'completed';
  note: string | null;
  completed: string | null;
  started: string | null;
  tasklist_id?: string | null;

  // ★ reviewFlags は JSON では配列
  reviewFlags?: ReviewFlag[];
}

/**
 * タスクJSONユーティリティ
 * 保存・読込・変換・フィルタなどの共通処理
 */
export class TaskJsonUtils {
  static readonly BASE_DIR = '_journal/meta';

  constructor(private app: App) {}

  /** --- JSONファイルへ保存 */
  async save(tasks: MyTask[], date: Date): Promise<string> {
    const fileName = `tasks_${DateUtil.localDate(date)}.json`;
    const path = normalizePath(`${TaskJsonUtils.BASE_DIR}/${fileName}`);

    const payload: TaskJsonRecord[] = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      parent: t.parent ?? null,
      pomodoro: {
        planned: t.pomodoro?.planned ?? null,
        actual: t.pomodoro?.actual ?? null,
      },
      status: t.status ?? 'needsAction',
      note: t.note ?? null,
      completed: t.completed ?? null,
      started: t.started ?? null,
      tasklist_id: (t as any).tasklist_id ?? null,

      // ★ Set → Array（永続化）
      reviewFlags:
        t.reviewFlags && t.reviewFlags.size > 0
          ? Array.from(t.reviewFlags)
          : undefined,
    }));

    const adapter = this.app.vault.adapter;
    if (!(await adapter.exists(TaskJsonUtils.BASE_DIR))) {
      await adapter.mkdir(TaskJsonUtils.BASE_DIR);
      logger.debug(`[TaskJsonUtils] created dir: ${TaskJsonUtils.BASE_DIR}`);
    }

    await adapter.write(path, JSON.stringify(payload, null, 2));
    logger.info(`[TaskJsonUtils] saved ${tasks.length} tasks -> ${path}`);
    return path;
  }

  /** --- 指定日のタスクJSONが存在するか */
  async exists(date: Date): Promise<boolean> {
    const fileName = `tasks_${DateUtil.localDate(date)}.json`;
    const path = normalizePath(`${TaskJsonUtils.BASE_DIR}/${fileName}`);
    const adapter = this.app.vault.adapter;

    const exists = await adapter.exists(path);
    logger.debug(`[TaskJsonUtils.exists] ${path} -> ${exists}`);
    return exists;
  }

  /** --- 指定日のタスクJSONを読み込み（存在しない場合は空配列） */
  async load(date: Date): Promise<MyTask[]> {
    const fileName = `tasks_${DateUtil.localDate(date)}.json`;
    const path = normalizePath(`${TaskJsonUtils.BASE_DIR}/${fileName}`);
    const adapter = this.app.vault.adapter;

    if (!(await adapter.exists(path))) {
      logger.warn(`[TaskJsonUtils] file not found: ${path}`);
      return [];
    }

    const jsonText = await adapter.read(path);
    const raw = JSON.parse(jsonText) as TaskJsonRecord[];

    const tasks = raw.map((t) => {
      // GoogleTaskRaw は「API互換用の一時構造」
      const normalized: GoogleTaskRaw = {
        id: t.id,
        title: t.title,
        parent: t.parent ?? undefined,

        pomodoro: t.pomodoro
          ? {
              planned: t.pomodoro.planned ?? undefined,
              actual: t.pomodoro.actual ?? undefined,
            }
          : undefined,

        status: t.status,
        note: t.note ?? undefined,
        completed: t.completed ?? undefined,
        started: t.started ?? undefined,

        // JSONには存在しない項目は補完
        due: undefined,
        updated: undefined,
        deleted: false,
      };

      // GoogleTask 互換変換
      const task = MyTaskFactory.fromGoogleTask(
        normalized,
        t.tasklist_id ?? 'Today',
      );

      // ★ Array → Set（ドメイン表現へ）
      if (Array.isArray(t.reviewFlags) && t.reviewFlags.length > 0) {
        task.reviewFlags = new Set<ReviewFlag>(t.reviewFlags);
      }

      logger.debug(
        `[TaskJsonUtils.load] id=${task.id} reviewFlags=${JSON.stringify(
          task.reviewFlags ? Array.from(task.reviewFlags) : [],
        )}`,
      );

      return task;
    });

    logger.info(`[TaskJsonUtils] loaded ${tasks.length} tasks from ${path}`);
    return tasks;
  }

  /** --- 最近n日分のファイルを読み込む（将来の分析用） */
  async loadRecent(days: number): Promise<MyTask[]> {
    const allTasks: MyTask[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const tasks = await this.load(date);
      allTasks.push(...tasks);
    }
    return allTasks;
  }
}
