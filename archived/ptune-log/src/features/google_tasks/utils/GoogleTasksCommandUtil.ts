import { Plugin, Notice } from 'obsidian';
import { GoogleTasksAPI } from './GoogleTasksAPI';
import type { GoogleAuthSettings } from '../../../config/ConfigManager';
import { logger } from 'src/core/services/logger/loggerInstance';
import { MyTask } from 'src/core/models/tasks/MyTask';
import { TokenManager } from '../google_auth/TokenManager';
import { ErrorUtils } from 'src/core/utils/common/ErrorUtils';

/**
 * Google Tasks コマンド共通ユーティリティ
 * - コマンド実行ラッパーやMarkdown生成を担当
 */
export class GoogleTasksCommandUtil {
  /**
   * Google Tasks API 呼び出し共通ラップ
   */
  static wrap(
    plugin: Plugin,
    settings: GoogleAuthSettings,
    runner: (api: GoogleTasksAPI) => Promise<void>
  ): () => Promise<void> {
    return async () => {
      logger.debug('[GoogleTasksCommandUtil.wrap] start');
      try {
        const tokenManager = new TokenManager(plugin, settings);
        const api = new GoogleTasksAPI(tokenManager);
        await runner(api);
        logger.debug('[GoogleTasksCommandUtil.wrap] done');
      } catch (e: unknown) {
        logger.error('[GoogleTasksCommandUtil.wrap] error', e);
        const msg = ErrorUtils.toMessage(e);
        new Notice(`Google Tasks API に失敗しました : ${msg}`, 8000);
      }
    };
  }

  /**
   * タスク一覧をMarkdown整形
   */
  static buildNoteContent(tasks: MyTask[]): string {
    logger.debug('[GoogleTasksCommandUtil.buildNoteContent] start');
    const parentTasks: MyTask[] = [];
    const subTaskMap = new Map<string, MyTask[]>();

    for (const task of tasks) {
      if (task.parent) {
        const list = subTaskMap.get(task.parent) ?? [];
        list.push(task);
        subTaskMap.set(task.parent, list);
      } else {
        parentTasks.push(task);
      }
    }

    const sortByPosition = (a: MyTask, b: MyTask) =>
      (a.position || '').localeCompare(b.position || '');
    const lines: string[] = [];

    for (const parent of parentTasks.sort(sortByPosition)) {
      lines.push(this.formatTaskLine(parent));
      const children = subTaskMap.get(parent.id) ?? [];
      for (const child of children.sort(sortByPosition)) {
        lines.push(this.formatTaskLine(child, 1));
      }
    }

    logger.debug(
      `[GoogleTasksCommandUtil.buildNoteContent] done lines=${lines.length}`
    );
    return lines.join('\n');
  }

  /**
   * タスク1件をMarkdown行に変換
   */
  static formatTaskLine(task: MyTask, indentLevel = 0): string {
    const indent = '  '.repeat(indentLevel);
    return `${indent}- ${task.toString()}`;
  }
}
