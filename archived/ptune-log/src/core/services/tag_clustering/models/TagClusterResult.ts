import { TagCluster } from './TagCluster';

export interface TagClusterResult {
  clusters: TagCluster[];
  meta: {
    k: number;
    total: number;
  };
}
