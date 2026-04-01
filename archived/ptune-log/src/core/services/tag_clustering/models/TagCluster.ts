import { TagVector } from 'src/core/models/vectors/TagVectors';

export interface TagCluster {
  /** 中心に最も近い実在タグ */
  representative: TagVector;

  /** クラスタに属する全タグ */
  members: TagVector[];
}
