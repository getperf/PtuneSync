// src/i18n/I18nRoot.ts

import { DomainI18n } from './domain';
import type { UiI18n } from './ui';

export type I18nRoot = {
  ui: UiI18n;
  domain: DomainI18n;
};
