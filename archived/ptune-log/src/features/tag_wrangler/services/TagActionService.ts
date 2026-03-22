// File: src/features/tag_wrangler/services/TagActionService.ts

import { App, Notice } from 'obsidian';
import { TagRenamer } from './TagRenamer';
import { logger } from 'src/core/services/logger/loggerInstance';
import { ErrorUtils } from 'src/core/utils/common/ErrorUtils';
import { TagSuggestionService } from 'src/features/tags/services/TagSuggestionService';
import { TagAliasUpdater } from 'src/features/tags/services/TagAliasUpdater';
import { TargetTagEditorDialog } from 'src/core/ui/tags/TargetTagEditorDialog';
import { TargetTagEditorOptions } from 'src/core/ui/tags/TargetTagEditorOptions';
import { LLMClient } from 'src/core/services/llm/client/LLMClient';

/**
 * Tag アクション共通サービス
 *
 * - rename / disable のユースケースを提供
 * - from（元タグ）は Service 内でのみ扱う
 * - Dialog は「to（変更後タグ）を編集・選択する UI」として利用
 */
export class TagActionService {
  private readonly tagSuggestionService: TagSuggestionService;

  constructor(private readonly app: App, private readonly llmClient: LLMClient) {
    this.tagSuggestionService = new TagSuggestionService(app, llmClient);
    logger.debug('[TagActionService] initialized');
  }

  /** タグ名変更 */
  async rename(fromTag: string): Promise<void> {
    logger.debug(`[TagActionService.rename] start: from=${fromTag}`);

    const updater = new TagAliasUpdater(this.app);
    await updater.ensureLoaded();

    const options: TargetTagEditorOptions = {
      state: {
        initialInput: fromTag,
      },

      // rename 用のタグ候補検索
      // - fromTag を考慮した候補生成は TagSuggestionService に委譲する
      search: this.tagSuggestionService,

      result: {
        confirm: async (toTag: string) => {
          try {
            if (!toTag || toTag === fromTag) {
              logger.debug(
                '[TagActionService.rename] no-op (same tag or empty)',
              );
              return;
            }

            logger.debug(
              `[TagActionService.rename] execute rename: ${fromTag} -> ${toTag}`,
            );

            const renamer = new TagRenamer(this.app, updater);
            await renamer.rename(fromTag, toTag);
            await updater.save();

            new Notice(`Renamed #${fromTag} → #${toTag}`);
            logger.info(
              `[TagActionService.rename] success: ${fromTag} → ${toTag}`,
            );
          } catch (err) {
            const msg = ErrorUtils.toMessage(err);
            logger.error(`[TagActionService.rename] failed: ${msg}`);
            new Notice(`Rename failed: ${msg}`);
          }
        },

        cancel: () => {
          logger.debug('[TagActionService.rename] canceled');
        },
      },
    };

    new TargetTagEditorDialog(this.app, options).open();
  }

  /** タグ無効化（既存仕様維持） */
  async disable(tagName: string): Promise<void> {
    logger.debug(`[TagActionService.disable] start: tag=${tagName}`);

    try {
      const updater = new TagAliasUpdater(this.app);
      await updater.ensureLoaded();

      const renamer = new TagRenamer(this.app, updater);
      await renamer.rename(tagName, '1'); // 無効化用の予約タグ（既存仕様）
      await updater.save();

      new Notice(`#${tagName} を無効化しました（#1 に置換）`);
      logger.info(`[TagActionService.disable] success: ${tagName} → #1`);
    } catch (err) {
      const msg = ErrorUtils.toMessage(err);
      logger.error(`[TagActionService.disable] failed: ${msg}`);
      new Notice(`無効化失敗: ${msg}`);
    }
  }
}
