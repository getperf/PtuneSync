// src/i18n/initI18n.ts
import { i18n, getI18n, Lang } from './';

export function initI18n(lang: Lang) {
  i18n.init(lang, getI18n(lang));
}
