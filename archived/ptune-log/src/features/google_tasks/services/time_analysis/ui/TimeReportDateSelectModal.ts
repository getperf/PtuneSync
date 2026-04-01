// File: src/features/google_tasks/services/time_analysis/ui/TimeReportDateSelectModal.ts

import { App, Modal, Setting } from 'obsidian';
import { DateUtil } from 'src/core/utils/date/DateUtil';
import { TaskReviewStatus } from '../TaskReviewReportService';

export class TimeReportDateSelectModal extends Modal {
  private selectedDate: Date = new Date();
  private enableLLMAnalysis = true;
  private closeOnComplete = true;
  private statusEl!: HTMLDivElement;
  private isRunning = false;

  constructor(
    app: App,
    private readonly onGenerate: (
      date: Date,
      options: {
        enableLLMAnalysis: boolean;
        statusListener: {
          onStatusChange: (status: TaskReviewStatus, message?: string) => void;
        };
      }
    ) => Promise<void>
  ) {
    super(app);
  }

  async onOpen(): Promise<void> {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('task-review-report-modal');

    // --- 見出し ---
    contentEl.createEl('h2', {
      text: 'タスクの振り返り（時間分析）',
    });

    // --- 日付選択 ---
    new Setting(contentEl)
      .setName('対象日')
      .setDesc('過去7日間から振り返る日付を選択してください。' +
        '当日を選択した場合、タスクインポートを開始します')
      .addDropdown((drop) => {
        const options: Record<string, string> = {};
        for (let i = 0; i < 7; i++) {
          const d = DateUtil.mNow().subtract(i, 'days');
          const key = d.format('YYYY-MM-DD');
          options[key] = key;
        }

        const selected = DateUtil.m(this.selectedDate).format('YYYY-MM-DD');
        drop.addOptions(options);
        drop.setValue(selected);

        drop.onChange((value) => {
          this.selectedDate = new Date(value);
        });
      });

    // --- LLM 分析トグル ---
    new Setting(contentEl)
      .setName('LLMによる時間分析を有効にする')
      .setDesc('LLM を用いたタスクとノートの時間分析を実行します')
      .addToggle((toggle) => {
        toggle.setValue(true);
        toggle.onChange((value) => {
          this.enableLLMAnalysis = value;
        });
      });

    // --- ステータス表示 ---
    this.statusEl = contentEl.createDiv({
      cls: 'task-review-status',
      text: '実行待機',
    });

    // --- 実行 / キャンセル ---
    new Setting(contentEl)
      .addButton((btn) =>
        btn
          .setButtonText('✅ 実行する')
          .setCta()
          .onClick(async () => {
            if (this.isRunning) return;
            this.isRunning = true;
            btn.setDisabled(true);

            await this.execute();
          })
      )
      .addButton((btn) =>
        btn.setButtonText('キャンセル').onClick(() => this.close())
      );
  }

  private async execute(): Promise<void> {
    await this.onGenerate(this.selectedDate, {
      enableLLMAnalysis: this.enableLLMAnalysis,
      statusListener: {
        onStatusChange: (_status, message) => {
          if (message) this.statusEl.setText(message);
        },
      },
    });

    this.statusEl.setText('完了');
    this.isRunning = false;

    if (this.closeOnComplete) {
      setTimeout(() => this.close(), 1500);
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
