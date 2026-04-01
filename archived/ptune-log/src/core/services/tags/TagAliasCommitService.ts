// File: src/core/services/tags/TagAliasCommitService.ts

import { Vault } from 'obsidian';
import { TagAliases } from 'src/core/models/tags/TagAliases';
import { logger } from 'src/core/services/logger/loggerInstance';

/**
 * TagAliasCommitService
 * --------------------------------------------------
 * 確定したタグ集合を Alias 辞書へコミットする共通サービス。
 *
 * 責務:
 * - Alias 未登録タグを unchecked で登録
 * - 差分がある場合のみ永続化
 *
 * 非責務:
 * - いつ commit するかの判断（feature 側）
 */
export class TagAliasCommitService {
  constructor(private readonly aliases: TagAliases) {}

  async commit(tags: string[], vault: Vault): Promise<boolean> {
    let updated = false;

    for (const tag of tags) {
      if (!this.aliases.has(tag)) {
        logger.debug(
          `[TagAliasCommitService] register unchecked alias: ${tag}`,
        );
        this.aliases.registerIfMissing(tag); // checked=false
        updated = true;
      }
    }

    if (updated) {
      logger.info('[TagAliasCommitService] saving aliases');
      await this.aliases.save(vault);
    }

    return updated;
  }
}
