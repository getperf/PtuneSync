// src/features/llm_tags/services/tags/TagAliasMerger.ts
import { App, Notice, Modal, Setting } from 'obsidian';
import { TagExtractor } from './TagExtractor';
import { TagAliases } from 'src/core/models/tags/TagAliases';
import { Tags } from 'src/core/models/tags/Tags';
import {
  TagAliasMergerDialog,
  TagAliasMergeOptions,
} from '../ui/TagAliasMergerDialog';
import { TagRenamer } from 'src/features/tag_wrangler/services/TagRenamer';
import { LLMClient } from 'src/core/services/llm/client/LLMClient';
import { logger } from 'src/core/services/logger/loggerInstance';
import { TagDBMaintainer } from './TagDBMaintainer';

/**
 * タグ名寄せ・エイリアス統合クラス
 * - モーダルに処理を委譲し、リネーム・辞書更新・DB更新を行う
 */
export class TagAliasMerger {
  private tags!: Tags;

  constructor(private app: App, private llmClient: LLMClient) {}

  /** メイン処理エントリ */
  async run(): Promise<TagAliases> {
    this.tags = await TagExtractor.extractAndGroup(this.app);
    const aliases = new TagAliases();
    await aliases.load(this.app.vault);

    this.ensureAliases(this.tags, aliases);
    logger.debug(`[TagAliasMerger.run] tags=${this.tags.getAll().length}`);

    const modal = new TagAliasMergerDialog(
      this.app,
      aliases,
      this.tags,
      this.llmClient,
      async (selected, options) => {
        const count = await this.applyTagRenames(aliases, selected, options);

        // --- キャンセル時はNoticeを出さず終了 ---
        if (count === null) {
          logger.info('[TagAliasMerger.run] user canceled DB rebuild');
          return;
        }

        const msg = options.enableRename
          ? `タグ辞書およびノート内タグを更新しました (${count} 件)`
          : `タグ辞書を更新しました（タグリネームは無効）`;
        new Notice(msg, 8000);
        logger.debug(`[TagAliasMerger.run] completed, renamed=${count}`);
      }
    );

    modal.open();
    logger.debug('[TagAliasMerger.run] modal opened');
    return aliases;
  }

  /** alias → canonical 変換処理 */
  private async applyTagRenames(
    aliases: TagAliases,
    selected: Map<string, boolean>,
    options: TagAliasMergeOptions
  ): Promise<number | null> {
    const renamer = new TagRenamer(this.app);
    let count = 0;

    if (options.enableRename) {
      for (const aliasRow of aliases.getAll()) {
        const active = selected.get(aliasRow.aliasName);
        if (!active) continue;

        const from = aliasRow.aliasName;
        const to = aliasRow.tagName;
        if (from === to) continue;

        const exists = this.tags.getCount(from);
        if (!exists || exists <= 0) {
          logger.debug(`[TagAliasMerger.applyTagRenames] skip: #${from}`);
          continue;
        }

        logger.debug(
          `[TagAliasMerger.applyTagRenames] rename #${from} → #${to}`
        );
        await renamer.rename(from, to);
        count++;
      }
    }

    aliases.resetUpdate(selected);
    aliases.prepareForSave();
    await aliases.save(this.app.vault);
    logger.debug(`[TagAliasMerger.applyTagRenames] saved aliases`);

    // --- TagDB更新確認フロー ---
    if (options.enableRename && this.llmClient.hasEmbeddingModel()) {
      const confirmed = await this.showConfirmDialog(
        'タグ辞書とベクトルDBを再構築します。\n' +
          '処理には約90秒かかります。バックグラウンドで実行し、完了後に通知します。\n\n' +
          '実行しますか？'
      );

      if (!confirmed) {
        logger.info('[TagAliasMerger] TagDBMaintainer canceled by user');
        new Notice('処理をキャンセルしました。');
        return null; // ← キャンセル時はnullを返して上位でNoticeを抑止
      }

      new Notice(
        '⏳ ベクトルDBの再構築を開始しました（バックグラウンド実行）',
        8000
      );
      logger.info('[TagAliasMerger] TagDBMaintainer start (background)');

      void (async () => {
        const maint = new TagDBMaintainer(this.app, this.llmClient);
        await maint.rebuildAll();
        new Notice('✅ タグ辞書とベクトルDBの更新が完了しました', 10000);
        logger.info('[TagAliasMerger] TagDBMaintainer completed');
      })();
    }

    return count;
  }

  /** タグ辞書に存在しないタグを補完登録 */
  private ensureAliases(tags: Tags, aliases: TagAliases): void {
    let added = 0;
    for (const tag of tags.getAll()) {
      if (tag.tagKind === 'unclassified') continue;
      const existsFrom = aliases.has(tag.name);
      const existsTo = aliases.findByTo(tag.name);
      if (existsFrom || existsTo) continue;

      aliases.upsert({
        aliasName: tag.name,
        tagKind: tag.tagKind,
        tagName: tag.name,
        tagKey: '',
        checked: false,
        isDeleted: false,
      });
      added++;
    }
    logger.debug(`[TagAliasMerger.ensureAliases] added=${added}`);
  }

  /** 確認モーダル */
  private async showConfirmDialog(message: string): Promise<boolean> {
    return await new Promise((resolve) => {
      const modal = new ConfirmModal(this.app, message, resolve);
      modal.open();
    });
  }
}

/** 単純な確認モーダル */
class ConfirmModal extends Modal {
  constructor(
    app: App,
    private message: string,
    private onCloseCallback: (result: boolean) => void
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('p', { text: this.message });

    new Setting(contentEl)
      .addButton((btn) =>
        btn
          .setButtonText('実行')
          .setCta()
          .onClick(() => {
            this.onCloseCallback(true); // resolve first
            this.close(); // close after callback
          })
      )
      .addButton((btn) =>
        btn.setButtonText('キャンセル').onClick(() => {
          this.onCloseCallback(false); // resolve first
          this.close(); // close after callback
        })
      );
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
