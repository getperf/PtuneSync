import { App, normalizePath, TFile } from 'obsidian';
import { DateUtil } from 'src/core/utils/date/DateUtil';
import { logger } from 'src/core/services/logger/loggerInstance';
import { FrontmatterWriter } from 'src/core/utils/frontmatter/FrontmatterWriter';
import { TemplateRenderer } from 'src/core/utils/template/TemplateRenderer';
import { PROJECT_INDEX_TEMPLATE } from 'src/core/templates/project_index/project_index_template';

/**
 * FolderIndexWriterService
 * - index.md を新規作成（初期化専用）
 * - フロントマターには created/updated のみを記録
 */
export class FolderIndexWriterService {
  constructor(private app: App) { }

  /**
   * 指定フォルダ内に index.md を新規作成
   * - 既存の内容がない前提で、初期構成を出力
   */
  async createIndexNote(folderPath: string): Promise<void> {
    const now = DateUtil.localISOString();
    const content = TemplateRenderer.render(PROJECT_INDEX_TEMPLATE, {
      created: now,
      updated: now,
      folderPath,
    });

    const indexPath = normalizePath(`${folderPath}/index.md`);
    await this.app.vault.adapter.write(indexPath, content);
    logger.info(`[FolderIndexWriterService] index.md created: ${indexPath}`);
  }

  /**
   * index.md が存在しない場合に新規作成する
   * - 存在する場合は何もしない（将来的に差分更新も検討可能）
   */
  async ensureIndexNote(folderPath: string): Promise<void> {
    const indexPath = normalizePath(`${folderPath}/index.md`);
    const existing = this.app.vault.getAbstractFileByPath(indexPath);
    if (existing) {
      logger.debug(
        `[FolderIndexWriterService] index.md already exists: ${indexPath}`
      );
      return;
    }
    await this.createIndexNote(folderPath);
  }

  /**
   * index.md の frontmatter に tags を追加または更新（FrontmatterWriter を使用）
   */
  async updateTags(folderPath: string, tags: string[]): Promise<void> {
    const indexPath = normalizePath(`${folderPath}/index.md`);
    const file = this.app.vault.getAbstractFileByPath(indexPath);

    if (!file || !(file instanceof TFile)) {
      logger.warn(
        `[FolderIndexWriterService] index.md not found: ${indexPath}`
      );
      return;
    }

    const writer = new FrontmatterWriter(this.app.vault);
    const mergedTags = [...new Set(tags)].sort();

    await writer.update(file, {
      updated: new Date().toISOString(),
      tags: mergedTags,
    });

    logger.info(
      `[FolderIndexWriterService] tags written via FrontmatterWriter: ${indexPath}`
    );
  }
}
