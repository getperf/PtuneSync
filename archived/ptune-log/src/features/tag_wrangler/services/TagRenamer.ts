import {
  App,
  Notice,
  parseFrontMatterAliases,
  parseFrontMatterTags,
} from 'obsidian';
import { Replacement } from '../models/Replacement';
import { TagFileUpdater } from './TagFileUpdater';
import { Tag } from '../models/Tag';
import { logger } from 'src/core/services/logger/loggerInstance';
import { TagAliasUpdater } from 'src/features/tags/services/TagAliasUpdater';

/**
 * タグリネーム処理クラス
 * - frontmatter と本文を含む全ファイルに対してタグ名を一括変更
 * - TagAliasUpdater による辞書更新も連携
 */
export class TagRenamer {
  constructor(private app: App, private updater?: TagAliasUpdater) {}

  /** タグ名を新しい名前にリネーム */
  async rename(tagName: string, newName: string): Promise<void> {
    logger.debug(`[TagRenamer.rename] start: ${tagName} → ${newName}`);

    if (!newName || newName === tagName) {
      new Notice('タグ名が変更されていません');
      logger.debug('[TagRenamer.rename] skipped: same name or empty');
      return;
    }

    const oldTag = new Tag(tagName);
    const newTag = new Tag(newName);
    const replace = new Replacement(oldTag, newTag);

    const targets = this.findTargets(oldTag);
    if (!targets.length) {
      logger.info(`[TagRenamer.rename] no target files found for #${tagName}`);
      new Notice(`対象ファイルが見つかりません: #${tagName}`);
      return;
    }

    let updated = 0;
    for (const file of targets) {
      const fileUpdater = new TagFileUpdater(
        this.app,
        file.filename,
        file.tagPositions,
        file.hasFrontMatter,
        this.updater
      );
      if (await fileUpdater.update(replace)) {
        updated++;
        logger.debug(`[TagRenamer.rename] updated file: ${file.filename}`);
      }
    }

    logger.info(
      `[TagRenamer.rename] complete: #${tagName} → #${newName} (${updated} files)`
    );
    new Notice(`タグを変更しました: #${tagName} → #${newName} (${updated}件)`);
  }

  /** 対象ファイルを検索 */
  private findTargets(tag: Tag) {
    logger.debug(`[TagRenamer.findTargets] search start: ${tag.tag}`);

    const targets: any[] = [];
    const cachedFiles = (
      this.app.metadataCache as any
    ).getCachedFiles() as string[];

    for (const filename of cachedFiles) {
      const cache = this.app.metadataCache.getCache(filename);
      if (!cache) continue;

      const { frontmatter, tags } = cache;
      const fmtags = (parseFrontMatterTags(frontmatter) || []).filter(
        tag.matches
      );
      const aliasTags = (parseFrontMatterAliases(frontmatter) || [])
        .filter(Tag.isTag)
        .filter(tag.matches);

      if (
        tags?.some((t) => tag.matches(t.tag)) ||
        fmtags.length ||
        aliasTags.length
      ) {
        targets.push({
          filename,
          tagPositions: tags ?? [],
          hasFrontMatter: fmtags.length + aliasTags.length > 0,
        });
      }
    }

    logger.info(
      `[TagRenamer.findTargets] found ${targets.length} files for #${tag.name}`
    );
    return targets;
  }
}
