// src/features/note_creator/NoteCreatorModal.ts
import { App, Modal, Notice, Setting, TFolder } from 'obsidian';
import { ConfigManager } from 'src/config/ConfigManager';
import { PrefixGenerator } from 'src/features/note_creator/services/PrefixGenerator';
import { NoteCreator } from '../commands/NoteCreator';
import { logger } from 'src/core/services/logger/loggerInstance';
import { GoalCategory, GoalCategoryLabels } from '../services/GoalCategory';
import { GoalTemplateService } from '../services/GoalTemplateService';
import { DailyNoteTaskKeyReader } from 'src/core/services/daily_notes/task_keys/DailyNoteTaskKeyReader';

export enum SerialNoteCreationType {
  FILE = 'file',
  FOLDER = 'folder',
}

/**
 * ノート作成入力情報
 * taskKey はタスク連携時にセットされる識別子（ExportTasks 由来）
 */
export interface NoteCreationInput {
  folderPath: string;
  title: string;
  prefix: string;
  creationType: SerialNoteCreationType;
  taskKey?: string;
  goal?: string;
}

/**
 * 連番付きノート／フォルダ作成モーダル
 * - タスク選択時に taskKey をタイトルへ自動セット（未入力時のみ）
 * - タイトル編集後は自動反映を無効化
 */
export class NoteCreatorModal extends Modal {
  private input: Partial<NoteCreationInput> = {};
  private onSubmit: (result: NoteCreationInput) => void;

  constructor(
    app: App,
    private folder: TFolder,
    private config: ConfigManager,
    private creationType: SerialNoteCreationType,
    onSubmit: (result: NoteCreationInput) => void
  ) {
    super(app);
    this.onSubmit = onSubmit;
    this.input.folderPath = this.folder.path;
    this.input.creationType = creationType;
  }

  /**
   * モーダル表示時のUI構築処理
   */
  async onOpen() {
    const { contentEl } = this;
    const title =
      this.creationType === SerialNoteCreationType.FILE
        ? '連番付きファイル作成'
        : '連番付きフォルダ作成';
    contentEl.createEl('h2', { text: title });

    // --- 1. 連番取得 ---
    const prefix = await PrefixGenerator.getNextPrefix(
      this.app.vault,
      this.folder,
      this.creationType,
      this.config
    );
    if (!prefix) {
      logger.error('[NoteCreatorModal.onOpen] プレフィックス取得失敗');
      new Notice('連番の取得に失敗しました');
      this.close();
      return;
    }
    this.input.prefix = prefix;

    // --- 2. タスクリストを読込 ---
    const taskList = await DailyNoteTaskKeyReader.read(this.app);

    let inputTitle = '';
    let inputTitleEl: HTMLInputElement;
    let isTitleEdited = false; // ← 編集済みフラグ

    // --- 3. タスク選択（存在する場合のみ表示） ---
    if (taskList.length > 0) {
      new Setting(contentEl).setName('タスクを選択').addDropdown((dropdown) => {
        dropdown.addOption('', '(選択なし)');
        for (const task of taskList) {
          dropdown.addOption(task.taskKey, task.title);
        }
        dropdown.onChange((value) => {
          this.input.taskKey = value;
          const matched = taskList.find((task) => task.taskKey === value);
          if (matched && !isTitleEdited) {
            inputTitle = matched.taskKey;
            if (inputTitleEl) inputTitleEl.value = matched.taskKey;
          }
          logger.debug(`[NoteCreatorModal] task selected: key=${value}`);
        });
      });
    }

    // --- 4. タイトル入力欄 ---
    new Setting(contentEl).setName('タイトル').addText((text) => {
      inputTitleEl = text.inputEl;
      this.setInputTitleLayout(inputTitleEl, prefix);
      text.onChange((value) => {
        inputTitle = value;
        isTitleEdited = true; // ← ユーザーが手動入力したことを記録
      });
      text.inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.input.title = inputTitle.trim();
          void (async () => {
            await this.handleSubmit();
          })();
        }
      });
    });

    let goalTextEl: HTMLInputElement;

    // --- 5. 目的入力 ---
    new Setting(contentEl).setName('目的カテゴリ').addDropdown((dropdown) => {
      dropdown.addOption('', '(選択なし)');
      for (const key of Object.values(GoalCategory)) {
        dropdown.addOption(key, GoalCategoryLabels[key]);
      }
      dropdown.onChange((value) => {
        if (!value) return;
        const template = GoalTemplateService.getTemplate(value as GoalCategory);
        if (goalTextEl) goalTextEl.value = template;
        this.input.goal = template;
      });
    });

    // --- goal 入力欄 ---
    new Setting(contentEl).setName('目標（1 行）').addText((text) => {
      goalTextEl = text.inputEl;
      text.setPlaceholder('例: API のレスポンス仕様を 2 パターン比較する');
      text.onChange((value) => {
        this.input.goal = value.trim();
      });
    });

    // --- 6. 作成ボタン ---
    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText('作成')
        .setCta()
        .onClick(async () => {
          this.input.title = inputTitle.trim();
          await this.handleSubmit();
        })
    );

    setTimeout(() => inputTitleEl.focus(), 0);
  }

  /**
   * 入力検証＋作成処理呼び出し
   */
  async handleSubmit() {
    if (!NoteCreator.validateInput(this.input)) {
      logger.warn('[NoteCreatorModal.handleSubmit] 入力検証失敗');
      return;
    }

    this.close();
    await Promise.resolve(this.onSubmit(this.input as NoteCreationInput));
  }

  /**
   * 入力欄の前後にプレフィックス／拡張子を表示
   */
  setInputTitleLayout(textEl: HTMLInputElement, prefix: string) {
    const container = textEl.parentElement;
    if (!container) return;

    textEl.placeholder = 'タイトルを入力';
    textEl.addClass('long-text-input');

    const prefixSpan = createEl('span', {
      text: `${prefix}_`,
      cls: 'filename-prefix',
    });
    container.insertBefore(prefixSpan, textEl);

    if (this.creationType === SerialNoteCreationType.FILE) {
      const suffixSpan = createEl('span', {
        text: '.md',
        cls: 'filename-suffix',
      });
      container.appendChild(suffixSpan);
    }
  }

  /**
   * モーダルクローズ処理
   */
  onClose() {
    this.contentEl.empty();
  }
}
