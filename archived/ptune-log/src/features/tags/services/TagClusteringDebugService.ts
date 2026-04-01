import { App } from 'obsidian';
import { TagVectors } from 'src/core/models/vectors/TagVectors';
import { KMeansClusteringService } from 'src/core/services/tag_clustering/KMeansClusteringService';
import { logger } from 'src/core/services/logger/loggerInstance';

export class TagClusteringDebugService {
  constructor(private readonly app: App) {}

  async run(vectors: TagVectors): Promise<void> {
    const service = new KMeansClusteringService();

    const result = service.cluster(vectors.getAll(), {
      k: 300,
      iterations: 5,
    });

    logger.debug(
      `[TagClusteringDebug] clustering done: clusters=${result.clusters.length}, total=${result.meta.total}`
    );

    result.clusters.forEach((cluster, idx) => {
      logger.debug('');
      logger.debug(`[KMeansCluster][${idx}]`);
      logger.debug(
        `  rep: ${cluster.representative.key} (size=${cluster.members.length})`
      );

      cluster.members.forEach((m) => {
        logger.debug(`  - ${m.key} (count=${m.count})`);
      });
    });
  }
}
