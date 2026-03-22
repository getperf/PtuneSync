// File: src/core/services/notes/NoteSearchService.ts
import { App, TFile, TFolder } from 'obsidian';
import { NoteFrontmatterParser } from 'src/core/utils/frontmatter/NoteFrontmatterParser';
import { logger } from 'src/core/services/logger/loggerInstance';
import { DateUtil } from 'src/core/utils/date/DateUtil';

export class NoteSearchService {
  constructor(private readonly app: App) { }

  async findByDate(date: Date): Promise<TFile[]> {
    const targetKey = DateUtil.dateKey(date);
    const results: TFile[] = [];

    const allFiles = this.app.vault.getMarkdownFiles();

    const start = new Date(date);
    start.setDate(start.getDate() - 1);

    const filtered = allFiles.filter((f) => {
      const ctime = new Date(f.stat.ctime);
      return start <= ctime;
    });

    logger.debug(
      `[NoteSearchService.findByDate] loose pre-filter=${filtered.length} files`
    );

    for (const file of filtered) {
      const fm = await NoteFrontmatterParser.parseFromFile(this.app, file);

      if (typeof fm.dailynote !== "string") {
        logger.debug(`[findByDate] skip no dailynote: ${file.path}`);
        continue;
      }

      const dailynoteKey = DateUtil.extractDateKeyFromLink(fm.dailynote);

      if (!dailynoteKey) {
        logger.debug(`[findByDate] invalid dailynote link: ${file.path}`);
        continue;
      }

      if (dailynoteKey === targetKey) {
        results.push(file);
      }
    }

    logger.debug(
      `[NoteSearchService.findByDate] ${targetKey} -> ${results.length} matched`
    );

    return results;
  }

  findInFolder(folder: TFolder): TFile[] {
    const results: TFile[] = [];
    const traverse = (f: TFolder) => {
      for (const child of f.children) {
        if (child instanceof TFile && child.extension === 'md') results.push(child);
        else if (child instanceof TFolder) traverse(child);
      }
    };
    traverse(folder);

    logger.debug(
      `[NoteSearchService.findInFolder] folder=${folder.path} -> ${results.length} files`
    );

    return results;
  }
}
