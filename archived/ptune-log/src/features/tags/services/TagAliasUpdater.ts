import { App } from 'obsidian';
import { TagAliases } from 'src/core/models/tags/TagAliases';
import { normalizeTag } from 'src/core/utils/tag/normalizeTag';
import { TagKindRegistry } from 'src/core/models/tags/TagKindRegistry';
import { logger } from 'src/core/services/logger/loggerInstance';

/**
 * タグエイリアス辞書の更新サービス
 * - rename / disable の両方に対応
 * - newTag が #1, 1, (空) の場合は isDeleted=true とする
 */
export class TagAliasUpdater {
  private aliases: TagAliases | null = null;
  private changed = new Map<string, string>(); // oldTag -> newTag

  constructor(private app: App) {}

  /**
   * 辞書データを初回ロード
   */
  async ensureLoaded(): Promise<void> {
    if (this.aliases) return;
    this.aliases = new TagAliases();
    await this.aliases.load(this.app.vault);
    logger.debug('[TagAliasUpdater.ensureLoaded] aliases loaded');
  }

  /**
   * タグエイリアスの更新処理（rename / disable）
   */
  async updateAlias(aliasName: string, newTag: string): Promise<void> {
    await this.ensureLoaded();
    if (!this.aliases) return;

    const normalized = normalizeTag(aliasName);
    const newNormalized = normalizeTag(newTag);
    const registry = TagKindRegistry.getInstance();
    const tagKind = registry.getKindOrUnclassified(normalized).id;

    // --- 削除判定 ---
    const isDeleted =
      !newNormalized ||
      newNormalized.toLowerCase().startsWith('1') ||
      newNormalized.toLowerCase().startsWith('#1');

    logger.debug(
      `[TagAliasUpdater.updateAlias] #${normalized} → #${newNormalized} (isDeleted=${isDeleted})`
    );

    this.aliases.upsert({
      aliasName: normalized,
      tagKind: tagKind,
      tagName: newNormalized,
      tagKey: '',
      checked: true,
      isDeleted: isDeleted,
    });

    this.changed.set(normalized, newNormalized);
  }

  /**
   * 更新済みのエイリアス変更マップを取得
   */
  getChanges(): Map<string, string> {
    logger.debug(`[TagAliasUpdater.getChanges] count=${this.changed.size}`);
    return this.changed;
  }

  /**
   * 更新内容を保存
   */
  async save(): Promise<void> {
    if (this.aliases) {
      await this.aliases.save(this.app.vault);
      logger.debug('[TagAliasUpdater.save] aliases saved');
    }
  }
}
