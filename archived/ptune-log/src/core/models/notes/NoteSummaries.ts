import { App, TFile } from 'obsidian';
import { logger } from 'src/core/services/logger/loggerInstance';

import { NoteSummary } from './NoteSummary';
import { NoteProjectFolder } from './NoteProjectFolder';
import { UnregisteredTagService } from 'src/core/services/tags/UnregisteredTagService';
import { NoteSummaryFactory } from './NoteSummaryFactory';
import { SummaryRenderOptions } from 'src/core/services/notes/NoteSummaryMarkdownBuilder';
import { KPTResult } from '../daily_notes/KPTResult';

/**
 * --- NoteSummaries
 * Map<noteFolder, NoteProjectFolder> として複数ノートを管理。
 * 各ノートは NoteProjectFolder に属し、フォルダ単位で集約される。
 */
export class NoteSummaries {
  private readonly folders = new Map<string, NoteProjectFolder>();
  kpt?: KPTResult;

  /** --- add
   * NoteSummary を登録し、フォルダ単位に分類して追加する。
   */
  add(summary: NoteSummary): void {
    const folderKey = this.extractNoteFolder(summary.notePath);
    if (!folderKey) return;
    summary.noteFolder = folderKey;
    if (!this.folders.has(folderKey)) {
      this.folders.set(folderKey, new NoteProjectFolder(folderKey));
      logger.debug(`[NoteSummaries.add] new folder created: ${folderKey}`);
    }
    this.folders.get(folderKey)!.add(summary);
  }

  /** KPT結果をセット */
  setKptResult(result: KPTResult): void {
    this.kpt = result;
  }

  /** --- getAll
   * すべての NoteSummary を配列で返す。
   */
  getAll(): NoteSummary[] {
    const all = [...this.folders.values()].flatMap((f) => f.getNotes());
    return all;
  }

  /** --- getFoldersSorted
   * 数値順でソートされたフォルダ一覧を返す。
   */
  getFoldersSorted(): NoteProjectFolder[] {
    const sorted = [...this.folders.values()].sort(
      (a, b) => a.getNumericKey() - b.getNumericKey()
    );
    logger.debug(`[NoteSummaries.getFoldersSorted] count=${sorted.length}`);
    return sorted;
  }

  /** --- getAllTags
   * 全タグをユニーク抽出して返す。
   */
  getAllTags(): string[] {
    const tags = Array.from(new Set(this.getAll().flatMap((n) => n.tags)));
    logger.debug(`[NoteSummaries.getAllTags] totalTags=${tags.length}`);
    return tags;
  }

  /** --- getAllNewCandidates
   * 新規タグ候補をユニーク抽出して返す。
   */
  getAllUnregisteredTags(): string[] {
    const newTags = Array.from(
      new Set(this.getAll().flatMap((n) => n.unregisteredTags))
    );
    logger.debug(
      `[NoteSummaries.getAllUnregisteredTags] totalNew=${newTags.length}`
    );
    return newTags;
  }

  /** --- extractNoteFolder
   * ファイルパスからフォルダキーを抽出（例: "207_開発/xxx.md" → "207_開発"）
   */
  private extractNoteFolder(filePath: string): string | null {
    const parts = filePath.split('/');
    if (parts.length < 2) return null;

    const parent = parts.slice(0, -1); // ファイル名を除外
    const lastDir = parent.at(-1) ?? '';

    // プレフィックスあり → フルパスで返す（_projects/273_分析）
    if (/^\d+_/.test(lastDir)) {
      return parent.join('/');
    }
    if (parent.length === 1) {
      return parent[0];
    }
    return null;
  }

  /** --- create
   * TFile とタグ生成結果から NoteSummary を生成する簡易ファクトリ。
   */
  static create(
    file: TFile,
    summary: string,
    tags: string[],
    newCandidates: string[]
  ): NoteSummary {
    logger.debug(`[NoteSummaries.create] create for ${file.path}`);
    return new NoteSummary(file.path, summary, tags, newCandidates, new Date());
  }

  /** --- summaryMarkdown
   * フォルダ単位で Markdown 要約を構築。
   */
  summaryMarkdown(options: SummaryRenderOptions = {}): string {
    const lines: string[] = [];
    const heading = '#'.repeat(options.baseHeadingLevel ?? 3);

    for (const folder of this.getFoldersSorted()) {
      lines.push(`${heading} ${folder.noteFolder}`);
      for (const note of folder.getNotes()) {
        lines.push(
          note.toMarkdownSummary({
            ...options,
            baseHeadingLevel: (options.baseHeadingLevel ?? 3) + 1,
          })
        );
      }
    }

    return lines.join('\n');
  }
  /**
   * 各ノートの要約を notePath とともに取得する
   */
  getNoteSummariesList(): { notePath: string; summary: string }[] {
    return this.getAll().map((s) => ({
      notePath: s.notePath,
      summary: s.summary,
    }));
  }

  /**
   * 未登録タグを一括セット
   */
  async applyUnregisteredTags(
    app: App,
    service: UnregisteredTagService
  ): Promise<NoteSummaries> {
    await service.ensureLoaded(app.vault);

    const updated = new NoteSummaries();

    for (const summary of this.getAll()) {
      const unregistered = service.detect(summary.tags);
      const recreated = NoteSummaryFactory.recreateWithUnregisteredTags(
        summary,
        unregistered
      );
      updated.add(recreated);
    }

    return updated;
  }
}
