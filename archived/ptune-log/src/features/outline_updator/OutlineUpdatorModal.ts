import { App, Modal, Setting } from 'obsidian';
import { OutlineContents } from './OutlineContents';

export class OutlineUpdatorModal extends Modal {
  private lineContainerEl: HTMLDivElement;
  private isSelecting = false;

  // 追加: 選択管理
  private cursorIndex = 0; // 非Shiftカーソル移動の基準
  private selectionAnchorIndex: number; // 範囲選択の起点
  private focusIndex: number; // 範囲選択の終点（動く側）

  private keyHandler: (e: KeyboardEvent) => void;
  private mouseUpHandler: (e: MouseEvent) => void;

  constructor(
    app: App,
    private contents: OutlineContents,
    private onExecute: (updated: OutlineContents) => void
  ) {
    super(app);
    this.keyHandler = this.onKeyDown.bind(this);
    this.mouseUpHandler = this.onMouseUp.bind(this);

    // 初期値は start に合わせる
    this.selectionAnchorIndex = contents.start;
    this.focusIndex = contents.start;
    this.cursorIndex = contents.start;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: '選択した見出しのレベルを一括変更' });
    this.lineContainerEl = contentEl.createDiv({ cls: 'outline-list' });
    this.renderOutlineLines();

    // 初期表示
    const startEl = this.lineContainerEl.querySelector(
      `.outline-line[data-line-index="${this.cursorIndex}"]`
    );
    startEl?.scrollIntoView({ block: 'center', behavior: 'auto' });
    this.applySelection(this.selectionAnchorIndex, this.focusIndex);

    document.addEventListener('mouseup', this.mouseUpHandler, {
      passive: true,
    });
    document.addEventListener('keydown', this.keyHandler, { capture: true });

    new Setting(contentEl)
      .setName('選択範囲の見出しレベル調整')
      .addButton((btn) =>
        btn.setButtonText('🔼 レベル+1').onClick(() => {
          this.contents.incrementLevel();
          this.updateOutlineLineTexts();
        })
      )
      .addButton((btn) =>
        btn.setButtonText('🔽 レベル-1').onClick(() => {
          this.contents.decrementLevel();
          this.updateOutlineLineTexts();
        })
      )
      .addButton((btn) =>
        btn
          .setButtonText('✅ 反映')
          .setWarning()
          .onClick(() => {
            this.onExecute(this.contents);
            this.close();
          })
      );
  }

  onClose(): void {
    // --- 修正: capture:true を明示
    document.removeEventListener('keydown', this.keyHandler, { capture: true });
    document.removeEventListener('mouseup', this.mouseUpHandler, {
      capture: true,
    });
  }

  private onMouseUp(_: MouseEvent) {
    this.isSelecting = false;
  }

  private onKeyDown(e: KeyboardEvent): void {
    // Obsidian グローバルショートカットに奪われにくくする
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;

    const lines = this.contents.toList();
    const max = lines.length - 1;
    const delta = e.key === 'ArrowUp' ? -1 : 1;

    if (e.shiftKey) {
      // 範囲選択モード: anchor を固定し、focus だけ動かす
      let next = this.focusIndex + delta;
      next = Math.max(0, Math.min(next, max));
      // 変化が無ければ何もしない
      if (next === this.focusIndex) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      this.focusIndex = next;
      this.applySelection(this.selectionAnchorIndex, this.focusIndex);
      this.cursorIndex = this.focusIndex;
    } else {
      // 通常カーソル移動: 範囲リセットして単一選択
      let next = this.cursorIndex + delta;
      next = Math.max(0, Math.min(next, max));
      if (next === this.cursorIndex) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      this.cursorIndex = next;
      this.selectionAnchorIndex = next;
      this.focusIndex = next;
      this.applySelection(next, next);
    }

    // スクロール追従
    const target = this.lineContainerEl.children[
      this.focusIndex
    ] as HTMLElement;
    target?.scrollIntoView({ block: 'nearest' });

    e.preventDefault();
    e.stopPropagation();
  }

  // anchor と focus を受け取り、UI と contents を同期
  private applySelection(anchor: number, focus: number) {
    const [s, e] = anchor <= focus ? [anchor, focus] : [focus, anchor];
    const children = Array.from(this.lineContainerEl.children);

    children.forEach((el, i) => {
      el.classList.toggle('selected', i >= s && i <= e);
      el.classList.toggle('cursor', i === focus); // 視覚的フォーカス
    });

    this.contents.setSelectionRange(s, e);
  }

  private updateOutlineLineTexts(): void {
    const lines = this.contents.toList();
    const children = Array.from(this.lineContainerEl.children);
    for (let i = 0; i < Math.min(lines.length, children.length); i++) {
      (children[i] as HTMLElement).textContent = lines[i];
    }
  }

  private renderOutlineLines(): void {
    this.lineContainerEl.empty();
    const lines = this.contents.toList();

    lines.forEach((text, index) => {
      const lineEl = this.lineContainerEl.createDiv({
        text,
        cls: 'outline-line',
      });
      lineEl.dataset.lineIndex = String(index);

      lineEl.addEventListener('mousedown', (ev) => {
        this.isSelecting = true;

        // Shiftクリック: anchor維持, focusのみ変更
        if (ev.shiftKey) {
          this.focusIndex = index;
          this.cursorIndex = index;
          this.applySelection(this.selectionAnchorIndex, this.focusIndex);
        } else {
          // 通常クリック: 新しい選択起点
          this.selectionAnchorIndex = index;
          this.focusIndex = index;
          this.cursorIndex = index;
          this.applySelection(index, index);
        }
      });

      // 変更点: ドラッグ中のみ選択処理を許可
      lineEl.addEventListener('mouseenter', (ev) => {
        if (!this.isSelecting) return; // ← ホバー時の反転を無効化
        if (this.focusIndex === index) return;

        this.focusIndex = index;
        this.applySelection(this.selectionAnchorIndex, this.focusIndex);
      });

      // マウスを離した時にドラッグ終了
      lineEl.addEventListener('mouseup', () => {
        this.isSelecting = false;
      });
    });
  }
}
