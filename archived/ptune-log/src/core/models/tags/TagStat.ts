// src/core/models/tags/TagStat.ts

/**
 * TagStat
 * - Vector/KMeans 層とは分離された、頻度・登録状態付きタグ参照
 * - Merge / Detector / UI 共通モデル
 */
export interface TagStat {
  key: string; // タグ名
  count: number; // 出現件数
  isUnregistered: boolean; // 未登録 or 未分類タグ
}
