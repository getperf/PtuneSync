import { Plugin } from 'obsidian';
import { ConfigManager } from './src/config/ConfigManager';
import { PtuneSettingTab } from './src/config/SettingsTab';
import { LayoutRelocator } from 'src/app/LayoutRelocator';
import { PomodoroSuggest } from 'src/app/PomodoroSuggest';
import { GoogleTasksFeature } from 'src/features/google_tasks/GoogleTasksFeature';
import { TagContextMenuHandler } from 'src/features/tag_wrangler/TagContextMenuHandler';
import { logger } from 'src/core/services/logger/loggerInstance';
import { NoteCreator } from 'src/features/note_creator/commands/NoteCreator';
import { OutlineUpdator } from 'src/features/outline_updator/OutlineUpdator';
import { InitialSetupManager } from 'src/features/setup/InitialSetupManager';
import { NoteSetupHelper } from 'src/features/setup/NoteSetupHelper';
import { DailyReviewFeature } from 'src/features/daily_review/pipeline/DailyReviewFeature';

// ★ i18n 初期化（段階1）
import { i18n, getI18n, type Lang } from 'src/i18n';
import { I18nBootstrap } from 'src/i18n/I18nBootstrap';

export default class PtunePlugin extends Plugin {
  private config!: ConfigManager;
  private noteCreator!: NoteCreator;
  private suggest!: PomodoroSuggest;
  private dailyReviewFeature!: DailyReviewFeature;
  private googleTasks!: GoogleTasksFeature;
  private requiredPluginChecker!: InitialSetupManager;
  private noteSetupHelper!: NoteSetupHelper;
  private update!: OutlineUpdator;
  private tagUtilsHandler!: TagContextMenuHandler;

  async onload() {
    // --- 設定ロード ---
    this.config = new ConfigManager(this);
    await this.config.load();

    // --- i18n 初期化（段階1：ここだけ追加） ---
    const lang = (this.config.get<Lang>('ui.language') ?? 'ja') as Lang;
    I18nBootstrap.initialize(lang);

    // --- ロガー設定 ---
    await logger.initFileOutput(
      this.app.vault,
      this.config.get('enableLogFile')
    );
    logger.setLevel(this.config.get('logLevel'));
    logger.info('ptune-log plugin loading...');

    // --- 初期セットアップ ---
    this.noteSetupHelper = new NoteSetupHelper(this.app);
    await this.noteSetupHelper.ensureResources();

    // --- LLMタギング ---
    this.dailyReviewFeature = new DailyReviewFeature(
      this.app,
      this.config.settings.llm,
      this.config.settings.review
    );

    // --- Google Tasks ---
    this.googleTasks = new GoogleTasksFeature(
      this,
      this.config.settings.google_auth,
      this.config.settings.llm
    );
    this.googleTasks.regist();

    // --- ノート生成 ---
    this.noteCreator = new NoteCreator(this.app, this.config);
    this.registerEvent(this.noteCreator.registerFileMenuCallback());

    // --- エディタ補完 ---
    this.registerEditorSuggest(new PomodoroSuggest(this.app));

    this.requiredPluginChecker = new InitialSetupManager(
      this.app,
      this.noteSetupHelper
    );
    this.requiredPluginChecker.register(this);

    // --- アウトライン更新 ---
    this.update = new OutlineUpdator(this);
    this.update.regist();

    // --- Tag Context Menu ---
    this.tagUtilsHandler = new TagContextMenuHandler(
      this,
      this.config.settings.llm
    );
    this.tagUtilsHandler.register();

    // --- レイアウト準備後処理 ---
    this.app.workspace.onLayoutReady(async () => {
      const relocator = new LayoutRelocator(this.app);
      await relocator.ensureDefaultViewsInLeftPane();
      await this.requiredPluginChecker.checkAll();
      await this.dailyReviewFeature.register(this);
    });

    // --- 設定タブ登録（A案）---
    this.addSettingTab(new PtuneSettingTab(this.app, this, this.config));
  }

  onunload() {
    this.suggest?.close();
  }
}
