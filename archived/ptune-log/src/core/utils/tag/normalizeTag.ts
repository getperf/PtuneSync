// タグのフォーマット統一（全角→半角、空白除去、#除去）
export function normalizeTag(tag: string): string {
  return tag
    .trim()
    .replace(/^#/, '')
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) =>
      String.fromCharCode(s.charCodeAt(0) - 0xfee0)
    )
    .replace(/\s+/g, '');
}

export function normalizeTagForCompare(tag: string): string {
  const parts = tag.split('/');
  if (parts.length > 1) {
    tag = parts.pop() || '';
  }
  return tag
    .trim()
    .replace(/^#/, '')
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) =>
      String.fromCharCode(s.charCodeAt(0) - 0xfee0)
    )
    ?.replace(/[\s\-_]+/g, '')
    .toLowerCase(); // ← 比較用なので小文字化
}
