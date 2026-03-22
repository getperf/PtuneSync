import { App, Modal, ButtonComponent, Notice } from 'obsidian';
import { logger } from 'src/core/services/logger/loggerInstance';
import { TagSuggestionService } from '../services/TagSuggestionService';
import { TagCandidate } from 'src/core/models/tags/TagCandidate';
import { LLMClient } from 'src/core/services/llm/client/LLMClient';

/** 編集モード: rename または merge */
export type TagEditMode = 'rename' | 'merge';

/** UI呼び出し用の共通インターフェース */
export interface TagEditContext {
  from: string; // 編集対象
  to?: string; // 変更先（renameでは空、mergeでは初期値）
  mode?: TagEditMode;
  onSubmit: (
    from: string,
    to: string,
    opts: { isNormalized: boolean }
  ) => Promise<void>;
}

/**
 * タグ編集モーダル（rename／merge兼用）
 * Embeddingベースの類似候補表示を含む
 */
export class TagEditDialog extends Modal {
  private inputEl: HTMLInputElement;
  private listNormalEl: HTMLElement;
  private listVectorEl: HTMLElement;
  private selectedTag: string | null = null;
  private candidateService: TagSuggestionService;
  private hasEmbedding = false;
  private activeTab: 'normal' | 'vector' = 'normal';
  private tabNormalEl: HTMLButtonElement;
  private tabVectorEl: HTMLButtonElement;
  private normalCandidates: TagCandidate[] = [];

  constructor(
    app: App,
    private llmClient: LLMClient,
    private ctx: TagEditContext
  ) {
    super(app);
    this.candidateService = new TagSuggestionService(app, llmClient);
  }

  /**
   * モーダルオープン処理（UI構築）
   */
  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    const title =
      this.ctx.mode === 'merge'
        ? `タグ統合設定: ${this.ctx.from}`
        : `タグ名の変更: #${this.ctx.from}`;
    contentEl.createEl('h3', { text: title });

    logger.debug(`[TagEditDialog.onOpen] mode=${this.ctx.mode}`);

    // --- Embedding有効チェック
    this.hasEmbedding = this.llmClient.isVectorSearchAvailable();

    // --- From 表示
    contentEl.createEl('p', {
      text: `From: ${this.ctx.from}`,
      cls: 'tag-edit-from',
    });

    // --- To 入力欄
    this.inputEl = contentEl.createEl('input', {
      type: 'text',
      cls: 'tag-edit-input tag-edit-input-wide',
      attr: { placeholder: '変更後のタグを入力または選択' },
      value: this.ctx.to ?? '',
    });

    this.inputEl.addEventListener('input', (ev) => {
      const keyword = (ev.target as HTMLInputElement).value.trim();
      void this.updateCandidates(keyword);
    });

    // --- タブバー
    const tabRow = contentEl.createEl('div', { cls: 'tag-rename-tabs' });
    this.tabNormalEl = tabRow.createEl('button', { text: '通常候補' });
    this.tabVectorEl = tabRow.createEl('button', { text: '類似候補' });
    this.tabNormalEl.classList.add('active');
    this.tabNormalEl.addEventListener('click', () => this.switchTab('normal'));
    this.tabVectorEl.addEventListener('click', () => this.switchTab('vector'));

    // --- 候補リスト領域
    this.listNormalEl = contentEl.createEl('div', {
      cls: 'tag-candidate-list',
    });
    this.listVectorEl = contentEl.createEl('div', {
      cls: 'tag-candidate-list hidden',
    });

    // Embedding無効時に警告
    if (!this.hasEmbedding) {
      const warn = this.listVectorEl.createEl('div', {
        text: '⚠ 類似候補検索を利用するには Embedding モデルとベクトルDBが必要です。',
        cls: 'tag-candidate-warning',
      });
      new ButtonComponent(warn)
        .setButtonText('設定画面を開く')
        .onClick(
          () =>
            new Notice('設定 > LLM設定 で Embedding モデルを指定してください。')
        );
    }

    // --- ボタン行
    const btnRow = contentEl.createEl('div', { cls: 'tag-edit-buttons' });
    new ButtonComponent(btnRow)
      .setButtonText('適用')
      .setCta()
      .onClick(async () => {
        const newTag = this.selectedTag || this.inputEl.value.trim();
        if (!newTag) return;

        const isNormalized =
          !!this.selectedTag ||
          this.normalCandidates.some((c) => c.name === newTag);

        logger.debug(
          `[TagEditDialog.onSubmit] from=${this.ctx.from}, to=${newTag}, normalized=${isNormalized}`
        );

        await this.ctx.onSubmit(this.ctx.from, newTag, { isNormalized });
        this.close();
      });

    new ButtonComponent(btnRow).setButtonText('キャンセル').onClick(() => {
      logger.debug('[TagEditDialog.onCancel] modal closed');
      this.close();
    });

    // --- 初期候補更新
    await this.updateCandidates(this.ctx.to ?? '');
  }

  /**
   * タブ切り替え処理
   */
  private switchTab(tab: 'normal' | 'vector') {
    this.activeTab = tab;
    this.tabNormalEl.classList.toggle('active', tab === 'normal');
    this.tabVectorEl.classList.toggle('active', tab === 'vector');
    this.listNormalEl.toggleClass('hidden', tab !== 'normal');
    this.listVectorEl.toggleClass('hidden', tab !== 'vector');
    logger.debug(`[TagEditDialog.switchTab] activeTab=${tab}`);
  }

  /**
   * 候補更新（通常＋ベクトル）
   */
  private async updateCandidates(keyword: string): Promise<void> {
    const key = keyword || this.ctx.from.split('/').pop() || this.ctx.from;
    logger.debug(`[TagEditDialog.updateCandidates] keyword=${key}`);

    const normal = await this.candidateService.searchCandidates(key);
    this.normalCandidates = normal;
    this.renderCandidateList(this.listNormalEl, normal);
    logger.debug(
      `[TagEditDialog.updateCandidates] normalCandidates=${normal.length}`
    );

    if (this.hasEmbedding) {
      const vector = await this.candidateService.searchCandidates(key, {
        mode: 'vector',
      });
      this.renderCandidateList(this.listVectorEl, vector);
      logger.debug(
        `[TagEditDialog.updateCandidates] vectorCandidates=${vector.length}`
      );
    }
  }

  /**
   * 候補リスト描画
   */
  private renderCandidateList(
    container: HTMLElement,
    candidates: TagCandidate[]
  ): void {
    container.empty();
    if (candidates.length === 0) {
      container.createEl('div', {
        text: '候補が見つかりません',
        cls: 'tag-candidate-empty',
      });
      logger.debug('[TagEditDialog.renderCandidateList] empty list');
      return;
    }

    for (const c of candidates) {
      const label =
        typeof c.score === 'number'
          ? `${c.name} (${c.count}, ${c.score.toFixed(3)})`
          : `${c.name} (${c.count})`;

      const item = container.createEl('div', {
        text: label,
        cls: 'tag-candidate-item',
      });
      item.addEventListener('click', () => {
        this.selectedTag = c.name;
        this.inputEl.value = c.name;
        logger.debug(`[TagEditDialog.renderCandidateList] selected=${c.name}`);
      });
    }
  }

  /**
   * モーダルクローズ処理
   */
  onClose() {
    logger.debug('[TagEditDialog.onClose] modal closed');
    this.contentEl.empty();
  }
}
