/**
 * Obsidianアプリケーションのレイアウトを再配置するプロバイダークラス
 *
 * - file-explorer、outlineなどのデフォルトビューを左ペインに再配置する
 * - outlineビューのアイコンバーをタブヘッダーの空白位置に移動する
 */
import { App, WorkspaceLeaf } from 'obsidian';
import { logger } from 'src/core/services/logger/loggerInstance';

export class LayoutRelocator {
  private app: App;

  constructor(app: App) {
    this.app = app;
  }

  /**
   * 指定したビュータイプが左ペインに存在するかどうかを確認します。
   * @param viewTypeToCheck チェックするビュータイプの文字列
   * @returns 左ペインに存在する場合は true、存在しない場合は false
   */
  hasViewInLeftPane(viewTypeToCheck: string): boolean {
    let found = false;

    this.app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
      if (found) return;

      const viewType = leaf.view?.getViewType();
      const parentSplit = leaf.getRoot();
      const isInLeftDock = parentSplit === this.app.workspace.leftSplit;

      if (isInLeftDock && viewType === viewTypeToCheck) {
        found = true;
      }
    });
    return found;
  }

  /**
   * 指定したビュータイプを左ペインに開きます。
   * @param viewType 開くビューのタイプ
   * @param split 新しいペインを分割するかどうか（デフォルトは false）
   * @param makeActive 開いたビューをアクティブにするかどうか（デフォルトは false）
   */
  async openViewInLeftPane(
    viewType: string,
    split = false,
    makeActive = false
  ) {
    const { workspace } = this.app;
    const leaf = workspace.getLeftLeaf(split);
    if (!leaf) {
      logger.warn('Failed to retrieve the left pane');
      return;
    }
    await leaf.setViewState({
      type: viewType,
      active: makeActive,
    });
  }

  /* outline のアイコンバーを タブヘッダーの空白位置に移動します */
  relocateOutlineIconBar(): void {
    const outlineLeaf = document.querySelector(
      '.workspace-leaf-content[data-type="outline"]'
    );
    if (!outlineLeaf) {
      logger.warn('Outline leaf not found.');
      return;
    }
    // 親の .workspace-leaf を取得し、さらに親の .workspace-tabs を取得し、
    // .workspace-tabs 内の .workspace-tab-header-spacer を取得
    const leaf = outlineLeaf.closest('.workspace-leaf');
    const tabs = leaf?.closest('.workspace-tabs');
    const spacer = tabs?.querySelector('.workspace-tab-header-spacer');

    const navButtons = leaf?.querySelector('.nav-buttons-container');
    if (!spacer || !navButtons) {
      logger.warn('Spacer or nav buttons not found.');
      return;
    }
    spacer.prepend(navButtons);
  }

  /** file-explorer や outline を左ペインに再配置します */
  async ensureDefaultViewsInLeftPane() {
    const defaultViews: [string, boolean][] = [
      ['file-explorer', false],
      ['outline', true],
    ];
    for (const [viewType, split] of defaultViews) {
      if (!this.hasViewInLeftPane(viewType)) {
        await this.openViewInLeftPane(viewType, split);
      }
    }
    this.relocateOutlineIconBar();
  }
}

export {};
