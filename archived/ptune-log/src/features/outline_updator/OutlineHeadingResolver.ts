import { App, TFile } from 'obsidian';
import { OutlineHeading } from './OutlineHeading';
import { logger } from 'src/core/services/logger/loggerInstance';

export class OutlineHeadingResolver {
  /** 指定ファイルの見出し情報を抽出する */
  static getHeadings(app: App, file: TFile): OutlineHeading[] {
    logger.debug('[OutlineHeadingResolver.getHeadings] start', {
      file: file.path,
    });
    const cache = app.metadataCache.getFileCache(file);
    const rawHeadings = cache?.headings ?? [];

    const result = rawHeadings.map((h) => ({
      text: h.heading,
      level: h.level,
      line: h.position.start.line,
    }));

    logger.debug('[OutlineHeadingResolver.getHeadings] headings extracted', {
      count: result.length,
    });
    return result;
  }
}
