// File: src/features/google_tasks/services/import/WinTaskImportSource.ts

import { App } from 'obsidian';
import { MyTaskFactory } from 'src/core/models/tasks/MyTaskFactory';
import { WinAppUriBuilder } from '../../win/WinAppUriBuilder';
import { WinAppLauncher } from '../../win/WinAppLauncher';
import { GoogleTaskRaw } from 'src/core/models/tasks/google/GoogleTaskRaw';
import { TaskImportSource } from './TaskImportSource';
import { MyTask } from 'src/core/models/tasks/MyTask';

export class WinTaskImportSource implements TaskImportSource {
  private static readonly OUTPUT_FILE = 'import_tasks.json';
  private static readonly TASKLIST_NAME = 'Today';

  constructor(private readonly app: App) {}

  async loadTasks(): Promise<MyTask[]> {
    const uri = WinAppUriBuilder.buildImport(
      this.app,
      WinTaskImportSource.OUTPUT_FILE
    );
    const launcher = new WinAppLauncher(this.app.vault);
    await launcher.launchAndWait(uri, 'import');

    const jsonPath = `/.obsidian/plugins/ptune-log/work/${WinTaskImportSource.OUTPUT_FILE}`;
    const jsonText = await this.app.vault.adapter.read(jsonPath);
    const rawTasks = JSON.parse(jsonText) as GoogleTaskRaw[];

    const tasks = rawTasks
      .map((t) =>
        MyTaskFactory.fromGoogleTask(t, WinTaskImportSource.TASKLIST_NAME)
      )
      .reverse();

    return tasks;
  }
}
