// i18n/domain/daily_note/index.ts
import type { Lang } from '../../types';
import { ja } from './ja';
import { en } from './en';

export function getDailyNoteI18n(lang: Lang) {
  return lang === 'en' ? en : ja;
}
