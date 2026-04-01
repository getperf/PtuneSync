// File: src/core/ui/tags/TargetTagEditorDialog.ts

import { App, Modal, ButtonComponent } from 'obsidian';
import { TagCandidateRenderer } from './TagCandidateRenderer';
import { TargetTagEditorOptions } from './TargetTagEditorOptions';
import { logger } from 'src/core/services/logger/loggerInstance';

type SearchMode = 'normal' | 'vector';

export class TargetTagEditorDialog extends Modal {
  private inputEl!: HTMLInputElement;

  private listNormalEl!: HTMLElement;
  private listVectorEl!: HTMLElement;

  private tabNormalEl!: HTMLButtonElement;
  private tabVectorEl!: HTMLButtonElement;

  private activeTab: SearchMode = 'normal';
  private selectedTag: string | null = null;

  private normalRenderer!: TagCandidateRenderer;
  private vectorRenderer!: TagCandidateRenderer;

  constructor(app: App, private readonly opts: TargetTagEditorOptions) {
    super(app);
  }

  async onOpen(): Promise<void> {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h3', { text: 'Target Tag Editor' });

    // --- input ---
    this.inputEl = contentEl.createEl('input', {
      type: 'text',
      cls: 'tag-edit-input tag-edit-input-wide',
      value: this.opts.state.initialInput ?? '',
      attr: { placeholder: 'タグを入力または候補から選択' },
    });

    this.inputEl.addEventListener('input', async (ev) => {
      const key = (ev.target as HTMLInputElement).value.trim();
      this.selectedTag = null;

      if (this.activeTab === 'normal') {
        const list = await this.opts.search.searchNormal(key);
        this.normalRenderer.render(list);
      } else if (this.opts.search.searchVector) {
        const list = await this.opts.search.searchVector(key);
        this.vectorRenderer.render(list);
      }
    });

    // --- tabs ---
    const tabRow = contentEl.createEl('div', { cls: 'tag-rename-tabs' });

    this.tabNormalEl = tabRow.createEl('button', { text: '通常候補' });
    this.tabVectorEl = tabRow.createEl('button', { text: '類似候補' });

    this.tabNormalEl.classList.add('active');

    this.tabNormalEl.addEventListener('click', () => this.switchTab('normal'));
    this.tabVectorEl.addEventListener('click', () => this.switchTab('vector'));

    // --- candidate lists ---
    this.listNormalEl = contentEl.createEl('div', {
      cls: 'tag-candidate-list',
    });
    this.listVectorEl = contentEl.createEl('div', {
      cls: 'tag-candidate-list hidden',
    });

    this.normalRenderer = new TagCandidateRenderer(this.listNormalEl, (name) =>
      this.selectCandidate(name)
    );
    this.vectorRenderer = new TagCandidateRenderer(this.listVectorEl, (name) =>
      this.selectCandidate(name)
    );

    // --- buttons ---
    const btnRow = contentEl.createEl('div', { cls: 'tag-edit-buttons' });

    new ButtonComponent(btnRow)
      .setButtonText('Confirm')
      .setCta()
      .onClick(async () => {
        const value = this.selectedTag || this.inputEl.value.trim();
        if (!value) return;
        await this.opts.result.confirm(value);
        this.close();
      });

    new ButtonComponent(btnRow).setButtonText('Cancel').onClick(() => {
      this.opts.result.cancel?.();
      this.close();
    });

    // --- initial normal search ---
    const initKey = this.opts.state.initialInput ?? '';
    const initial = await this.opts.search.searchNormal(initKey);
    this.normalRenderer.render(initial);
  }

  private async switchTab(tab: SearchMode): Promise<void> {
    if (this.activeTab === tab) return;

    // vector 不可なら切替不可
    if (tab === 'vector' && !this.opts.search.isVectorAvailable()) {
      return;
    }

    this.activeTab = tab;

    this.tabNormalEl.classList.toggle('active', tab === 'normal');
    this.tabVectorEl.classList.toggle('active', tab === 'vector');

    this.listNormalEl.toggleClass('hidden', tab !== 'normal');
    this.listVectorEl.toggleClass('hidden', tab !== 'vector');

    const key = this.inputEl.value.trim();

    if (tab === 'normal') {
      const list = await this.opts.search.searchNormal(key);
      this.normalRenderer.render(list);
    } else if (this.opts.search.searchVector) {
      const list = await this.opts.search.searchVector(key);
      this.vectorRenderer.render(list);
    }

    logger.debug(`[TargetTagEditorDialog] switchTab=${tab}`);
  }

  private selectCandidate(name: string): void {
    this.selectedTag = name;
    this.inputEl.value = name;
    logger.debug(`[TargetTagEditorDialog] selected=${name}`);
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
