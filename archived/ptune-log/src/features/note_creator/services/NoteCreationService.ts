// src/features/note_creator/NoteCreationService.ts
import { App, TFile, TFolder, normalizePath } from 'obsidian';
import { FrontmatterWriter } from 'src/core/utils/frontmatter/FrontmatterWriter';
import { DateUtil } from 'src/core/utils/date/DateUtil';
import { logger } from 'src/core/services/logger/loggerInstance';
import { DailyNoteConfig } from 'src/core/utils/daily_note/DailyNoteConfig';
import { ConfigManager } from 'src/config/ConfigManager';
import { NoteCreationInput } from '../modals/NoteCreatorModal';
import { FolderIndexWriterService } from 'src/core/services/notes/FolderIndexWriterService';

/**
 * NoteCreationService
 * ノート／フォルダ作成と frontmatter 更新を担当。
 * バリデーションは上位 (NoteCreator) が実施。
 */
export class NoteCreationService {
  private writer: FrontmatterWriter;

  constructor(
    private readonly app: App,
    private readonly config: ConfigManager
  ) {
    this.writer = new FrontmatterWriter(app.vault);
  }

  /** --- ノート生成（テンプレート適用＋frontmatter登録） --- */
  async createNote(input: NoteCreationInput): Promise<TFile> {
    const vault = this.app.vault;
    const folderPath = normalizePath(input.folderPath);
    const newFilePath = `${folderPath}/${input.prefix}_${input.title}.md`;
    const existing = vault.getAbstractFileByPath(newFilePath);

    if (existing instanceof TFile) {
      logger.info(`[NoteCreationService] note already exists: ${newFilePath}`);
      return existing;
    }

    const templateText = this.config.get<string>('note.templateText');
    const content = templateText
      ? this.applyTemplate(templateText, input.title)
      : '';

    const file = await vault.create(newFilePath, content);
    await this.registerNoteMetadata(file, input);

    logger.info(`[NoteCreationService] note created: ${file.path}`);
    return file;
  }

  /**
   * フォルダ生成＋index.md 自動生成
   */
  async createFolderWithIndex(input: NoteCreationInput): Promise<TFolder> {
    const vault = this.app.vault;
    const folderPath = normalizePath(input.folderPath);
    const newFolderPath = `${folderPath}/${input.prefix}_${input.title}`;
    const folder = vault.getAbstractFileByPath(newFolderPath);

    if (folder instanceof TFolder) {
      logger.info(
        `[NoteCreationService] folder already exists: ${newFolderPath}`
      );
      return folder;
    }

    const created = await vault.createFolder(newFolderPath);
    logger.info(`[NoteCreationService] folder created: ${newFolderPath}`);

    const indexWriter = new FolderIndexWriterService(this.app);
    await indexWriter.createIndexNote(newFolderPath);

    return created;
  }

  /** --- テンプレート適用（{{title}}のみ置換） --- */
  private applyTemplate(
    template: string,
    title: string
  ): string {
    return template.replace(/{{title}}/g, title);
  }

  /**
   * --- frontmatter 登録 ---
   * taskKey が指定されている場合のみ登録。
   * createdAt / dailyNote は常に登録。
   */
  private async registerNoteMetadata(
    file: TFile,
    input: NoteCreationInput
  ): Promise<void> {
    try {
      const createdAt = DateUtil.localISOString();
      const dailyNote = await DailyNoteConfig.getTodayDailyNoteLink(
        this.app.vault
      );

      const frontmatter: Record<string, string> = { createdAt };
      if (dailyNote) frontmatter['dailynote'] = dailyNote;

      if (input.taskKey && input.taskKey.trim() !== '') {
        frontmatter['taskKey'] = input.taskKey;
      }
      if (input.goal && input.goal.trim() !== '') {
        frontmatter['goal'] = input.goal.trim();
      }

      await this.writer.update(file, frontmatter);

      logger.info(
        `[NoteCreationService] frontmatter updated: taskKey=${input.taskKey ?? 'none'
        }, createdAt=${createdAt}, dailyNote=${dailyNote ?? 'none'}`
      );
    } catch (err) {
      logger.error('[NoteCreationService] registerNoteMetadata failed', err);
    }
  }
}
