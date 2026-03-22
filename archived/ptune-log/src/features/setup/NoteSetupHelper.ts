import { App, Notice } from 'obsidian';
import { logger } from 'src/core/services/logger/loggerInstance';
import { buildDailyNoteTemplate } from 'src/core/templates/daily_note';

export class NoteSetupHelper {
  constructor(private app: App) {}

  /** 初期化済フラグファイル */
  private readonly initFlagPath = '_tagging/config/.init_done';

  /** ディレクトリ構造定義 */
  private readonly targetDirs: Record<string, string[]> = {
    _project: [],
    _journal: ['meta'],
    _templates: ['note'],
    _tagging: ['config', 'tags', 'meta', 'aliases'],
  };

  /** 指定ディレクトリの作成 */
  private async createNestedFolders(
    baseDirs: Record<string, string[]>
  ): Promise<string[]> {
    const { vault } = this.app;
    const created: string[] = [];

    for (const [base, subs] of Object.entries(baseDirs)) {
      try {
        if (!(await vault.adapter.exists(base))) {
          await vault.createFolder(base);
          created.push(base);
        }
        for (const sub of subs) {
          const full = `${base}/${sub}`;
          if (!(await vault.adapter.exists(full))) {
            await vault.createFolder(full);
            created.push(full);
          }
        }
      } catch (err) {
        logger.error(`[NoteSetupHelper] failed to create: ${base}`, err);
      }
    }
    return created;
  }

  /** テンプレート作成（force=true の場合は上書き） */
  private async ensureTemplateFile(
    path: string,
    content: string,
    force: boolean
  ): Promise<void> {
    const { vault } = this.app;
    try {
      const exists = await vault.adapter.exists(path);
      if (!exists || force) {
        if (exists) {
          await vault.adapter.write(path, content);
          logger.debug(`[NoteSetupHelper] overwritten template: ${path}`);
        } else {
          await vault.create(path, content);
          logger.debug(`[NoteSetupHelper] created template: ${path}`);
        }
      }
    } catch (err) {
      logger.error(`[NoteSetupHelper] failed to ensure template: ${path}`, err);
    }
  }

  /** 初期セットアップ */
  async ensureResources(options?: { force?: boolean }): Promise<void> {
    const force = options?.force === true;
    const adapter = this.app.vault.adapter;

    if (!force && (await adapter.exists(this.initFlagPath))) {
      logger.debug('[NoteSetupHelper] already initialized, skip');
      return;
    }

    logger.info(`[NoteSetupHelper] ensureResources start (force=${force})`);

    const created = await this.createNestedFolders(this.targetDirs);

    await this.ensureTemplateFile(
      '_templates/note/daily_note.md',
      buildDailyNoteTemplate(),
      force
    );

    // 初期化済フラグは force 時も更新
    await adapter.write(this.initFlagPath, 'initialized=true');

    if (created.length > 0 || force) {
      new Notice(
        'ノート関連のディレクトリとテンプレートを更新しました。',
        5000
      );
    }

    logger.info('[NoteSetupHelper] ensureResources complete');
  }
}
