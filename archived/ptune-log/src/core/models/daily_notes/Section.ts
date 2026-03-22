// src/core/models/daily_notes/Section.ts

import { SectionKey } from './SectionKey';

export class Section {
  readonly key: SectionKey;
  readonly suffix?: string;
  readonly body: string;
  readonly present: boolean;

  constructor(params: {
    key: SectionKey;
    body?: string;
    suffix?: string;
    present?: boolean;
  }) {
    this.key = params.key;
    this.body = params.body ?? '';
    this.suffix = params.suffix;
    this.present = params.present ?? false;
  }

  isEmpty(): boolean {
    return this.body.trim().length === 0;
  }

  /** 元ノートに存在していたか、または更新されたか */
  isPresent(): boolean {
    return this.present;
  }

  /** 本文が実質空か */
  hasContent(): boolean {
    return this.body.trim().length > 0;
  }

  /** 行数（Markdown上の目安） */
  lineCount(): number {
    if (!this.hasContent()) return 0;
    return this.body.split('\n').length;
  }

  /**
   * Section.body をそのまま行配列で返す
   * - trim / filter などの加工は行わない
   * - Extractor 側での既存解析（indent 等）前提
   */
  getRawLines(): string[] {
    if (!this.body) return [];
    // Markdown の改行をそのまま保持
    return this.body.split('\n');
  }

  replaceBody(markdown: string): Section {
    return new Section({
      ...this,
      body: markdown,
      present: true,
    });
  }

  appendBody(markdown: string): Section {
    return new Section({
      ...this,
      body: this.body ? `${this.body}\n\n${markdown}` : markdown,
      present: true,
    });
  }

  /** 空（未出現）セクション */
  static empty(key: SectionKey): Section {
    return new Section({ key, present: false });
  }

  /** 見出し検出時に生成 */
  static start(key: SectionKey, suffix?: string): Section {
    return new Section({ key, suffix, present: true });
  }

  /** body 確定済み（list 用） */
  static fromBody(key: SectionKey, body: string, suffix?: string): Section {
    return new Section({
      key,
      body,
      suffix,
      present: true,
    });
  }

  /** body 確定（immutability を保つ場合） */
  withBody(body: string): Section {
    return new Section({
      ...this,
      body,
    });
  }
}
