// src/features/note_analysis/ui/KptEditorModal.ts

import { App, Modal } from 'obsidian';
import Sortable from 'sortablejs';
import { KptDocument } from '../models/KptDocument';
import { KptNode } from '../models/KptNode';

export class KptEditorModal extends Modal {
  private sortables: Sortable[] = [];
  private resolve!: (doc: KptDocument) => void;

  static open(app: App, document: KptDocument): Promise<KptDocument> {
    return new Promise((resolve) => {
      const modal = new KptEditorModal(app, document, resolve);
      modal.open();
    });
  }

  constructor(
    app: App,
    private readonly document: KptDocument,
    resolve: (doc: KptDocument) => void,
  ) {
    super(app);
    this.resolve = resolve;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('kpt-sortable-modal');

    contentEl.createEl('h2', { text: 'KPT 編集' });
    const scrollEl = contentEl.createDiv({ cls: 'kpt-scroll-container' });

    this.renderSection(scrollEl, 'Keep', this.document.keep);
    this.renderSection(scrollEl, 'Problem', this.document.problem);
    this.renderSection(scrollEl, 'Try', this.document.try);

    contentEl.createEl('button', {
      text: 'Apply',
      cls: 'mod-cta',
    }).onclick = () => {
      this.resolve(this.document);
      this.close();
    };
  }

  onClose(): void {
    this.sortables.forEach((s) => s.destroy());
  }

  private renderSection(
    container: HTMLElement,
    title: string,
    nodes: KptNode[],
  ): void {
    container.createEl('h3', { text: title });
    const ul = container.createEl('ul', { cls: 'kpt-tree' });
    nodes.forEach((n) => this.renderNode(ul, n));
    this.attachSortable(ul);
  }

  private renderNode(parent: HTMLElement, node: KptNode): void {
    const li = parent.createEl('li', { cls: 'tree-node' });
    li.createDiv({ cls: 'tree-row' }).createSpan({
      cls: 'tree-text',
      text: node.text,
    }).setAttr('contenteditable', 'true');

    const ul = li.createEl('ul', { cls: 'tree-children' });
    node.children.forEach((c) => this.renderNode(ul, c));
    this.attachSortable(ul);
  }

  private attachSortable(el: HTMLElement): void {
    if ((el as any)._sortableAttached) return;
    (el as any)._sortableAttached = true;

    this.sortables.push(
      new Sortable(el, {
        group: 'kpt-tree',
        animation: 150,
        fallbackOnBody: true,
        draggable: '.tree-node',
      }),
    );
  }
}
