// File: src/i18n/types.ts

export type Lang = 'ja' | 'en';

export function isLang(v: string): v is Lang {
  return v === 'ja' || v === 'en';
}
