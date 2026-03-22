import { App, Notice, TFile } from 'obsidian';
import { GoogleTasksAPI } from 'src/features/google_tasks/utils/GoogleTasksAPI';
import { logger } from 'src/core/services/logger/loggerInstance';
import { TaskJsonUtils } from 'src/core/utils/task/TaskJsonUtils';
import { MyTask } from 'src/core/models/tasks/MyTask';
import { FileUtils } from 'src/core/utils/common/FileUtils';
import { TasksReset } from '../bootstrap/TasksReset';
import { TasksExporter } from './TasksExporter';
import { MarkdownTaskParser } from './MarkdownTaskParser';
import { TasksExportModal } from './TasksExportModal';
import { DailyNoteLoader } from 'src/core/services/daily_notes/file_io/DailyNoteLoader';
import { MarkdownTaskEntry } from 'src/core/models/tasks/MarkdownTaskEntry';

export class TasksExport {
  constructor(
    private app: App,
    private file: TFile,
    private api: GoogleTasksAPI,
    private taskListName: string = 'Today'
  ) {}

  async confirmAndRun(): Promise<void> {
    logger.info('[TasksExport.confirmAndRun] start');
    const tasks = await this.extractTasks();
    if (tasks.length === 0) {
      new Notice('エクスポート対象のタスクが見つかりません');
      return;
    }

    const resetter = new TasksReset(this.api, this.taskListName);
    const shouldReset = await resetter.hasExistingTasks();
    this.showExportModal(tasks, shouldReset);
  }

  private async extractTasks(): Promise<MarkdownTaskEntry[]> {
    const dailyNote = await DailyNoteLoader.load(this.app, new Date());

    const lines = dailyNote.plannedTask.getRawLines();
    const tasks = MarkdownTaskParser.parse(lines);

    logger.debug('[TasksExport.extractTasks]', {
      lineCount: lines.length,
      taskCount: tasks.length,
    });

    return tasks;
  }

  private showExportModal(
    tasks: MarkdownTaskEntry[],
    willReset: boolean
  ): void {
    const modal = new TasksExportModal(
      this.app,
      tasks,
      willReset,
      async (modal) => await this.runExport(tasks, modal, willReset)
    );
    modal.open();
  }

  private async runExport(
    tasks: MarkdownTaskEntry[],
    modal: TasksExportModal,
    willReset: boolean
  ): Promise<void> {
    logger.info('[TasksExport.runExport] start');
    try {
      if (willReset) {
        modal.setProgress('🗑 既存タスクを削除中...');
        const resetter = new TasksReset(this.api, this.taskListName);
        await resetter.run();
      }

      modal.setProgress('🚀 タスクをエクスポート中...');
      const exporter = new TasksExporter(this.api, this.taskListName);
      const myTasks: MyTask[] = await exporter.export(tasks, modal);

      // --- JSON保存をここで実行 ---
      const jsonUtils = new TaskJsonUtils(this.app);
      const path = await jsonUtils.save(myTasks, new Date());
      logger.info(`[TasksExport] tasks saved to ${path}`);

      modal.setCompleted(
        `🎉 エクスポート完了: ${myTasks.length}件を保存しました`
      );
    } catch (err) {
      modal.setError(`❌ エラーが発生しました: ${String(err)}`);
      logger.error('[TasksExport.runExport] failed', err);
    }
  }
}
