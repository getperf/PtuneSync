// src/i18n/singleton.ts

import type { I18nRoot } from './I18nRoot';
import type { Lang } from './types';

class I18nSingleton {
  lang!: Lang; // ★ 追加
  ui!: I18nRoot['ui'];
  domain!: I18nRoot['domain'];

  init(lang: Lang, root: I18nRoot) {
    this.lang = lang;
    this.ui = root.ui;
    this.domain = root.domain;
  }
}

export const i18n = new I18nSingleton();
