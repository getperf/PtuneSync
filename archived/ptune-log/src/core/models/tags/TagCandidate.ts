/**
 * タグ候補モデル
 * - テキスト検索／ベクトル検索いずれでも共通利用する
 * - count はタグ辞書由来（出現数）
 * - score はベクトル類似度（0〜1）
 */
export interface TagCandidate {
  name: string;
  count: number;
  score?: number;
  tagKind?: string;
}
