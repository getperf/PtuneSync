import { cosineSimilarity } from 'src/core/utils/vector/vectorUtils';

export interface SimilarityKMeansOptions {
  k: number;
  iterations: number;
  /**
   * この類似度未満の場合、どのクラスタにも割り当てない
   * 過剰マージ抑制用（例: 0.7）
   */
  minSimilarity?: number;
}

/**
 * SimilarityKMeans
 * - cosine 類似度ベース
 * - k-means++ 風初期化
 * - 類似度しきい値で過剰マージ抑制
 * - 収束判定あり
 *
 * 名寄せ・タグクラスタリング用途向け
 */
export class SimilarityKMeans {
  static run(vectors: number[][], options: SimilarityKMeansOptions): number[] {
    const { k, iterations, minSimilarity = -1 } = options;
    const n = vectors.length;
    if (n === 0) return [];

    // --- k-means++ 風 初期中心 ---
    let centroids = this.initCentroids(vectors, k);

    let assignments = new Array<number>(n).fill(-1);

    for (let iter = 0; iter < iterations; iter++) {
      let changed = false;

      // --- 割当 ---
      for (let i = 0; i < n; i++) {
        let best = -1;
        let bestScore = -Infinity;

        for (let c = 0; c < centroids.length; c++) {
          const score = cosineSimilarity(vectors[i], centroids[c]);
          if (score > bestScore) {
            bestScore = score;
            best = c;
          }
        }

        // 類似度しきい値チェック
        const next = bestScore >= minSimilarity ? best : -1;
        if (assignments[i] !== next) {
          assignments[i] = next;
          changed = true;
        }
      }

      // --- 収束判定 ---
      if (!changed) {
        break;
      }

      // --- 中心更新 ---
      const sums: number[][][] = Array.from(
        { length: centroids.length },
        () => [],
      );

      for (let i = 0; i < n; i++) {
        const c = assignments[i];
        if (c >= 0) {
          sums[c].push(vectors[i]);
        }
      }

      centroids = sums.map((cluster, idx) => {
        if (cluster.length === 0) {
          return centroids[idx]; // 空クラスタは維持
        }

        const dim = cluster[0].length;
        const mean = new Array<number>(dim).fill(0);

        for (const v of cluster) {
          for (let d = 0; d < dim; d++) {
            mean[d] += v[d];
          }
        }

        for (let d = 0; d < dim; d++) {
          mean[d] /= cluster.length;
        }
        return mean;
      });
    }

    return assignments;
  }

  /**
   * k-means++ 風初期化
   * - 最初はランダム
   * - 次は既存中心から最も遠い点を選択
   */
  private static initCentroids(vectors: number[][], k: number): number[][] {
    const shuffled = [...vectors];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, k).map((v) => [...v]);
  }
}
