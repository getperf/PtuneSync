export class SentenceSplitter {
  /**
   * シンプルなセンテンス分割
   * - 改行 → 区切り扱い
   * - 。！？」で分割
   */
  static split(text: string): string[] {
    return text
      .replace(/\r?\n+/g, '。')
      .split(/。|！|？|!|\?/g)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
}
