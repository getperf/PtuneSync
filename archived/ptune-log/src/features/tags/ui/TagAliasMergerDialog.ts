import { App, Modal, Notice, Setting } from 'obsidian';
import { TagAliasResolver, TagAliasPair } from '../services/TagAliasResolver';
import { TagEditDialog } from './TagEditDialog';
import { logger } from 'src/core/services/logger/loggerInstance';
import { TagAliases } from 'src/core/models/tags/TagAliases';
import { Tags } from 'src/core/models/tags/Tags';
import { TagKindRegistry } from 'src/core/models/tags/TagKindRegistry';
import { LLMClient } from 'src/core/services/llm/client/LLMClient';

export interface TagAliasMergeOptions {
  enableRename: boolean;
  includeChecked: boolean;
}

/**
 * タグマージレポートモーダル
 * - From(未マージ) → To(既存) の形式で表示
 */
export class TagAliasMergerDialog extends Modal {
  private registry = TagKindRegistry.getInstance();
  private aliasState = new Map<string, boolean>();
  private resolver = new TagAliasResolver();
  private summaryContainer: HTMLElement | null = null;
  private options: TagAliasMergeOptions = {
    enableRename: true,
    includeChecked: false,
  };
  private pairs: TagAliasPair[] = [];
  private unmerged: TagAliasPair[] = [];

  constructor(
    app: App,
    private aliases: TagAliases,
    private tags: Tags,
    private llmClient: LLMClient,
    private readonly onExecute: (
      selected: Map<string, boolean>,
      options: TagAliasMergeOptions
    ) => Promise<void>
  ) {
    super(app);
  }

  /**
   * モーダルを開いたときの初期描画処理
   */
  async onOpen() {
    await this.render();
    logger.debug('[TagAliasMergerModal.onOpen] rendered');
  }

  /**
   * 画面のメイン描画処理
   */
  private async render() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('tag-alias-merger-modal');

    contentEl.createEl('h2', { text: 'タグ辞書の名寄せ（From→To形式）' });
    contentEl.createEl('p', {
      text: '※ チェックを外すとそのタグはマージ対象外になります。',
      cls: 'setting-item-description',
    });

    new Setting(contentEl)
      .setName('確認済みのエイリアスも対象に含める')
      .addToggle((toggle) =>
        toggle.setValue(this.options.includeChecked).onChange(async (v) => {
          this.options.includeChecked = v;
          logger.debug(`[TagAliasMergerModal.render] includeChecked=${v}`);
          await this.renderSummary();
        })
      );

    new Setting(contentEl)
      .setName('タグマージを同時に実行')
      .addToggle((toggle) =>
        toggle.setValue(this.options.enableRename).onChange((v) => {
          this.options.enableRename = v;
          logger.debug(`[TagAliasMergerModal.render] enableRename=${v}`);
        })
      );

    this.summaryContainer = contentEl.createDiv({
      cls: 'tag-alias-summary-container',
    });
    await this.renderSummary();

    new Setting(contentEl)
      .addButton((btn) =>
        btn.setButtonText('コピー').onClick(async () => {
          await navigator.clipboard.writeText(this.buildCopyText());
          new Notice('結果をクリップボードにコピーしました');
          logger.debug('[TagAliasMergerModal.render] copy executed');
        })
      )
      .addButton((btn) =>
        btn
          .setButtonText('✅ 実行')
          .setCta()
          .onClick(async () => {
            await this.onExecute(this.aliasState, this.options);
            logger.debug('[TagAliasMergerModal.render] executed');
            this.close();
          })
      )
      .addButton((btn) =>
        btn.setButtonText('キャンセル').onClick(() => {
          logger.debug('[TagAliasMergerModal.render] canceled');
          this.close();
        })
      );
  }

  /**
   * サマリ領域の再描画
   */
  private renderSummary(): void {
    if (!this.summaryContainer) return;
    this.summaryContainer.empty();

    if (this.pairs.length === 0 && this.unmerged.length === 0) {
      const result = this.resolver.resolve(
        this.aliases,
        this.tags,
        this.options.includeChecked
      );
      this.pairs = result.pairs;
      this.unmerged = result.unmerged;
      logger.debug(
        `[TagAliasMergerModal.renderSummary] pairs=${this.pairs.length}, unmerged=${this.unmerged.length}`
      );
    }

    this.renderPairSection('マージ候補', this.pairs);
    this.renderPairSection('⚠ マージ対象なしタグ', this.unmerged);
  }

  /**
   * 編集リンククリック時に編集モーダルを開く
   */
  private openEditDialog(pair: TagAliasPair) {
    const dialog = new TagEditDialog(this.app, this.llmClient, {
      from: pair.from,
      to: pair.to,
      mode: 'merge',
      onSubmit: async (from, to) => {
        pair.to = to;
        new Notice(`「${from}」の統合先を「${to}」に変更しました`);
        logger.debug(`[TagAliasMergerModal.openEditDialog] ${from}→${to}`);
        await this.renderSummary();
      },
    });
    dialog.open();
  }

  /**
   * ペア一覧セクションを描画
   */
  private renderPairSection(
    title: string,
    list: TagAliasPair[],
    prevState?: Map<string, boolean>
  ) {
    this.summaryContainer?.createEl('h3', { text: title });
    if (list.length === 0) {
      this.summaryContainer?.createEl('p', {
        text: '対象なし',
        cls: 'tag-alias-empty',
      });
      return;
    }

    const container = this.summaryContainer!.createDiv({
      cls: 'tag-alias-pair-container',
    });

    for (const pair of list) {
      const row = container.createDiv({ cls: 'tag-alias-row' });

      const cb = row.createEl('input', { type: 'checkbox' });
      cb.checked = prevState?.get(pair.from) ?? true;
      cb.addEventListener('change', () =>
        this.aliasState.set(pair.from, cb.checked)
      );
      this.aliasState.set(pair.from, cb.checked);

      const link = row.createEl('a', {
        text: pair.from,
        cls: 'tag-alias-from-link',
        href: '#',
      });
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.openEditDialog(pair);
      });

      if (pair.from !== pair.to) {
        row.createSpan({
          text: ` → ${pair.to}`,
          cls: 'tag-alias-to-text',
        });
      }
    }
  }

  /**
   * クリップボードコピー用のテキストを構築
   */
  private buildCopyText(): string {
    const { pairs } = this.resolver.resolve(
      this.aliases,
      this.tags,
      this.options.includeChecked
    );
    logger.debug(
      `[TagAliasMergerModal.buildCopyText] copied ${pairs.length} entries`
    );
    return pairs.map((p) => `${p.from} → ${p.to}`).join('\n');
  }
}
