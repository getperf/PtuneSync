// src/core/services/daily_notes/parse/HeadingNormalizer.ts
export class HeadingNormalizer {
  /**
   * 見出し比較用キーを生成
   * - Unicode 正規化
   * - 絵文字 / Variation Selector 除去
   * - 空白除去
   */
  static normalize(text: string): string {
    return text
      .normalize('NFKC')
      .replace(/\p{Extended_Pictographic}/gu, '')
      .replace(/\uFE0F/gu, '')
      .trim();
  }
}
