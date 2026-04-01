import { logger } from 'src/core/services/logger/loggerInstance';
import { NoteSummary } from './NoteSummary';
import { App, TFile, TFolder } from 'obsidian';
import { FolderIndexParser } from 'src/core/utils/frontmatter/FolderIndexParser';

/**
 * --- NoteProjectFolder
 * フォルダ（プロジェクト）単位で NoteSummary を管理するモデル。
 */
export class NoteProjectFolder {
  constructor(public readonly noteFolder: string) {}

  private commonTags: string[] = [];
  private readonly notes: NoteSummary[] = [];
  private loaded = false;

  /** --- ノートを追加 */
  add(note: NoteSummary): void {
    this.notes.push(note);
    logger.debug(
      `[NoteProjectFolder.add] added note=${note.notePath} folder=${this.noteFolder}`,
    );
  }

  /** --- 共通タグのセット */
  setCommonTags(tags: string[]): void {
    this.commonTags = [...tags];
  }

  /** --- 遅延ロード（index.md） */
  private async ensureLoaded(app: App): Promise<void> {
    if (this.loaded) return;
    await this.loadIndexFile(app);
    this.loaded = true;
  }

  private async loadIndexFile(app: App): Promise<void> {
    const indexPath = `${this.noteFolder}/index.md`;
    const file = app.vault.getAbstractFileByPath(indexPath);

    if (!file || !(file instanceof TFile)) {
      this.commonTags = [];
      return;
    }

    try {
      const text = await app.vault.read(file);
      const meta = FolderIndexParser.parse(text);
      this.commonTags = meta.commonTags ?? [];
    } catch {
      this.commonTags = [];
    }
  }

  /** --- プロジェクトタイトル解決 */
  async getProjectTitle(
    app: App,
    opts: { stripNumericPrefix?: boolean } = {},
  ): Promise<string> {
    await this.ensureLoaded(app);

    // 将来 index.md の title を使う場合の拡張点
    // const titleFromIndex = meta.title;

    const raw = this.deriveFolderName();
    return opts.stripNumericPrefix ? stripNumericPrefix(raw) : raw;
  }

  private deriveFolderName(): string {
    return this.noteFolder.split('/').pop() ?? this.noteFolder;
  }

  /** --- 共通タグの取得（初回は index.md を ensure load） */
  async getCommonTags(app: App): Promise<string[]> {
    await this.ensureLoaded(app);
    return [...this.commonTags];
  }
  /** --- フォルダ内ノート */
  getNotes(): NoteSummary[] {
    return [...this.notes];
  }

  /** --- 数値プレフィックス用キー */
  getNumericKey(): number {
    const m = this.noteFolder.match(/^(\d+)_?/);
    return m ? parseInt(m[1], 10) : 0;
  }

  /** --- TFolder 取得 */
  getTFolder(app: App): TFolder | null {
    const abstract = app.vault.getAbstractFileByPath(this.noteFolder);
    return abstract instanceof TFolder ? abstract : null;
  }
}

/** --- 数値プレフィックス除去ユーティリティ */
function stripNumericPrefix(text: string): string {
  return text.replace(/^\d+_?/, '');
}
