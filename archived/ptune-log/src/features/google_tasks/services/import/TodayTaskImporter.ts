// File: src/features/google_tasks/services/import/TodayTaskImporter.ts

import { App, Plugin } from 'obsidian';
import type { GoogleAuthSettings } from 'src/config/ConfigManager';
import { GoogleTasksCommandUtil } from '../../utils/GoogleTasksCommandUtil';
import { ApiTaskImportSource } from './ApiTaskImportSource';
import { WinTaskImportSource } from './WinTaskImportSource';
import { MyTask } from 'src/core/models/tasks/MyTask';

export class TodayTaskImporter {
  constructor(
    private readonly app: App,
    private readonly plugin: Plugin,
    private readonly settings: GoogleAuthSettings,
  ) {}

  async import(): Promise<MyTask[]> {
    if (this.settings.useWinApp) {
      const source = new WinTaskImportSource(this.app);
      return source.loadTasks();
    }

    let tasks: MyTask[] = [];
    await GoogleTasksCommandUtil.wrap(
      this.plugin,
      this.settings,
      async (api) => {
        const source = new ApiTaskImportSource(api);
        tasks = await source.loadTasks();
      },
    )();

    return tasks;
  }
}
