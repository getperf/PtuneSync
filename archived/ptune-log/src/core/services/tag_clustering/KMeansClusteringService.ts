import { TagVector } from 'src/core/models/vectors/TagVectors';
import { cosineSimilarity } from 'src/core/utils/vector/vectorUtils';
import { SimilarityKMeans } from './SimilarityKMeans';
import { TagCluster } from './models/TagCluster';
import { TagClusterResult } from './models/TagClusterResult';
import { logger } from '../logger/loggerInstance';

export interface KMeansClusterOptions {
  k: number;
  iterations?: number;
}

export class KMeansClusteringService {
  cluster(tags: TagVector[], options: KMeansClusterOptions): TagClusterResult {
    const { k, iterations = 5 } = options;

    logger.debug('[KMeans] input', {
      tagCount: tags.length,
      k,
      iterations,
    });

    if (tags.length === 0) {
      logger.warn('[KMeans] tags is empty');
    }

    const vectors = tags.map((t) => t.embedding);

    logger.debug('[KMeans] vectors prepared', {
      vectorCount: vectors.length,
      dim: vectors[0]?.length,
    });

    const assignments = SimilarityKMeans.run(vectors, { k, iterations });

    logger.debug('[KMeans] assignments returned', {
      length: assignments.length,
      sample: assignments.slice(0, 10),
    });

    const buckets: TagVector[][] = Array.from({ length: k }, () => []);

    for (let i = 0; i < assignments.length; i++) {
      const c = assignments[i];
      if (c >= 0 && c < k) {
        buckets[c].push(tags[i]);
      } else {
        logger.warn('[KMeans] invalid assignment', { i, c });
      }
    }

    logger.debug(
      '[KMeans] bucket sizes',
      buckets.map((b) => b.length),
    );

    const clusters: TagCluster[] = [];

    for (let c = 0; c < k; c++) {
      const members = buckets[c];
      if (members.length === 0) continue;

      const centroid = this.computeCentroid(members.map((m) => m.embedding));

      const representative = this.pickRepresentative(members, centroid);
      clusters.push({ representative, members });
    }

    logger.debug('[KMeans] clusters built', {
      clusterCount: clusters.length,
    });

    return {
      clusters,
      meta: {
        k,
        total: tags.length,
      },
    };
  }

  private computeCentroid(vectors: number[][]): number[] {
    const dim = vectors[0].length;
    const mean = new Array<number>(dim).fill(0);

    for (const v of vectors) {
      for (let d = 0; d < dim; d++) {
        mean[d] += v[d];
      }
    }
    for (let d = 0; d < dim; d++) {
      mean[d] /= vectors.length;
    }
    return mean;
  }

  private pickRepresentative(
    members: TagVector[],
    centroid: number[],
  ): TagVector {
    return members.reduce((best, cur) => {
      const s1 = cosineSimilarity(best.embedding, centroid);
      const s2 = cosineSimilarity(cur.embedding, centroid);
      return s2 > s1 ? cur : best;
    });
  }
}
