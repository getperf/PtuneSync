import { App, TFile } from 'obsidian';
import { logger } from 'src/core/services/logger/loggerInstance';

/**
 * --- Utils
 * Obsidian の操作全般に関する汎用ユーティリティ関数群。
 */
export class Utils {

  /** 日付プレフィックス */
  static getDatePrefix(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const MM = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const result = `${yyyy}${MM}${dd}${hh}${mm}${ss}`;
    logger.debug(`[Utils.getDatePrefix] ${result}`);
    return result;
  }

  /** ノートをエクスプローラでフォーカス */
  static focusFileInExplorer(app: App, file: TFile): void {
    logger.debug(`[Utils.focusFileInExplorer] reveal ${file.path}`);
    app.workspace.trigger('reveal', file);
  }

}
