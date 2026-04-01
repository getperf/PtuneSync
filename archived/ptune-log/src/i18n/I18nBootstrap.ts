// src/i18n/I18nBootstrap.ts
import { Lang, getI18n, i18n } from './';
import { HeadingSpecRegistry } from 'src/core/models/daily_notes/specs/HeadingSpecRegistry';

export class I18nBootstrap {
  static initialize(lang: Lang): void {
    // --- i18n 状態更新 ---
    i18n.init(lang, getI18n(lang));

    // --- 見出し仕様を言語依存で再構築 ---
    HeadingSpecRegistry.rebuildLabels();
  }
}
