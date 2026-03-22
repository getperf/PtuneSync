// src/core/services/daily_notes/DailyNoteSectionParser.ts

import { logger } from 'src/core/services/logger/loggerInstance';
import { DailyNoteSectionRegex } from 'src/core/utils/daily_note/DailyNoteSectionRegex';

export class DailyNoteSectionParserOld {
  /**
   * 見出し比較用キーを生成
   * - Unicode 正規化
   * - 絵文字 / Variation Selector 除去
   * - 空白除去
   */
  static normalizeHeadingKey(text: string): string {
    return text
      .normalize('NFKC')
      .replace(/\p{Extended_Pictographic}/gu, '')
      .replace(/\uFE0F/gu, '')
      .replace(/\s+/g, '')
      .trim();
  }

  static extractOnce(
    markdown: string,
    headingLabel: string
  ): string | undefined {
    return this.extractAll(markdown, headingLabel)[0];
  }

  /**
   * 同一セクションをすべて取得
   * - ## / ### をセクション境界として扱う
   * - #### 以降は本文に含める
   * - 同一見出しが複数ある場合は配列で返す
   */
  static extractAll(markdown: string, headingLabel: string): string[] {
    const targetKey = this.normalizeHeadingKey(headingLabel);
    const lines = markdown.split('\n');

    const results: string[] = [];
    let collecting = false;
    let buffer: string[] = [];

    for (const line of lines) {
      const headingText = DailyNoteSectionRegex.extractHeadingText(line);
      const isBoundary = DailyNoteSectionRegex.isSectionBoundary(line);

      if (headingText && isBoundary) {
        const key = this.normalizeHeadingKey(headingText);

        // 対象セクション開始
        if (key.startsWith(targetKey)) {
          if (collecting && buffer.length > 0) {
            results.push(buffer.join('\n').trim());
            buffer = [];
          }
          collecting = true;
          continue;
        }

        // 他セクション開始 → 終了
        if (collecting) {
          results.push(buffer.join('\n').trim());
          buffer = [];
          collecting = false;
        }
      }

      if (collecting) {
        buffer.push(line);
      }
    }

    if (collecting && buffer.length > 0) {
      results.push(buffer.join('\n').trim());
    }

    logger.debug(
      `[DailyNoteSectionParser] extractAll label="${headingLabel}" results=${results.length}`
    );

    return results.filter(Boolean);
  }
}
