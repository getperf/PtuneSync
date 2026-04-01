import { Menu, Plugin } from 'obsidian';
import { TagActionService } from './services/TagActionService';
import { LLMSettings } from 'src/config/settings/LLMSettings';
import { logger } from 'src/core/services/logger/loggerInstance';
import { LLMClient } from 'src/core/services/llm/client/LLMClient';

/**
 * タグ右クリックメニューの登録クラス
 * - タグペイン、本文タグ、プレビュータグの右クリックに対応
 * - TagActionService 経由でリネーム／無効化を実行
 */
export class TagContextMenuHandler {
  private actions: TagActionService;
  private llmClient: LLMClient;

  constructor(private plugin: Plugin, settings: LLMSettings) {
    const app = plugin.app;
    this.llmClient = new LLMClient(app, settings);
    this.actions = new TagActionService(app, this.llmClient);
    logger.debug('[TagContextMenuHandler] initialized');
  }

  /** 各ビューで右クリックメニューを登録 */
  register() {
    const app = this.plugin.app;
    logger.debug('[TagContextMenuHandler.register] start');

    // --- タグペインの右クリック ---
    this.plugin.registerDomEvent(document, 'contextmenu', (evt: MouseEvent) => {
      const el = (evt.target as HTMLElement).closest('.tag-pane-tag');
      if (!el) return;

      const tagName = el.querySelector(
        '.tag-pane-tag-text, .tree-item-inner-text'
      )?.textContent;
      if (!tagName) return;

      evt.preventDefault();
      evt.stopPropagation();
      logger.debug(
        `[TagContextMenuHandler] contextmenu (tag-pane): ${tagName}`
      );

      const menu = new Menu();
      this.buildMenu(menu, tagName);
      menu.showAtPosition({ x: evt.pageX, y: evt.pageY });
    });

    // --- 本文タグ (編集中) の右クリック ---
    this.plugin.registerEvent(
      app.workspace.on('editor-menu', (menu, editor) => {
        const cursor = editor.getCursor();
        const token = (editor as any).getClickableTokenAt?.(cursor);
        if (token?.type === 'tag' && token.text?.startsWith('#')) {
          const tagName = token.text.slice(1); // "#"を除去
          logger.debug(`[TagContextMenuHandler] editor-menu: ${tagName}`);
          this.buildMenu(menu, tagName);
        }
      })
    );

    // --- フロントマター(tags:) のピルへの右クリック対応
    this.plugin.registerDomEvent(document, 'contextmenu', (evt: MouseEvent) => {
      const el = (evt.target as HTMLElement).closest(
        '.metadata-property[data-property-key="tags"] .multi-select-pill'
      );
      if (!el) return;

      const tagName = el.textContent?.trim();
      if (!tagName) return;

      evt.preventDefault();
      evt.stopPropagation();
      logger.debug(
        `[TagContextMenuHandler] contextmenu (frontmatter-pill): ${tagName}`
      );

      const menu = new Menu();
      this.buildMenu(menu, tagName);
      menu.showAtPosition({ x: evt.pageX, y: evt.pageY });
    });

    // --- プレビュータグ (読み取り専用ビュー) ---
    this.plugin.registerDomEvent(document, 'contextmenu', (evt: MouseEvent) => {
      const el = (evt.target as HTMLElement).closest('a.tag[href^="#"]');
      if (!el) return;

      const tagName = el.getAttribute('href')?.slice(1);
      if (!tagName) return;

      evt.preventDefault();
      evt.stopPropagation();
      logger.debug(`[TagContextMenuHandler] contextmenu (preview): ${tagName}`);

      const menu = new Menu();
      this.buildMenu(menu, tagName);
      menu.showAtPosition({ x: evt.pageX, y: evt.pageY });
    });
  }

  /** 共通メニュー構築 */
  private buildMenu(menu: Menu, tagName: string) {
    logger.debug(
      `[TagContextMenuHandler.buildMenu] building menu for #${tagName}`
    );

    menu.addItem((item) =>
      item
        .setTitle(`タグをリネーム #${tagName}`)
        .setIcon('pencil')
        .onClick(async () => {
          logger.info(`[TagContextMenuHandler] rename selected: ${tagName}`);
          await this.actions.rename(tagName);
        })
    );

    menu.addItem((item) =>
      item
        .setTitle(`タグを無効化 #${tagName}`)
        .setIcon('trash')
        .onClick(async () => {
          logger.info(`[TagContextMenuHandler] disable selected: ${tagName}`);
          await this.actions.disable(tagName);
        })
    );
  }
}
