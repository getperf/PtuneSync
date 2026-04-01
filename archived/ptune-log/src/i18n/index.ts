// src/i18n/index.ts

import type { Lang } from './types';
import type { I18nRoot } from './I18nRoot';
import { getUiI18n } from './ui';
import { getDomainI18n } from './domain';

export function getI18n(lang: Lang): I18nRoot {
  return {
    ui: getUiI18n(lang),
    domain: getDomainI18n(lang),
  };
}

export type { Lang };
export { i18n } from './singleton';
export { initI18n } from './initI18n';
