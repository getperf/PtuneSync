// src/features/tag_merge/services/TagMergePriorityResolver.ts

import { TagMergePriorityKey } from '../../models/domain/TagMergePriority';
import { HierarchyPriorityDetector } from './detectors/HierarchyPriorityDetector';
import { VariantPriorityDetector } from './detectors/VariantPriorityDetector';

export interface TagMergePriorityResolverOptions {
  /**
   * この件数以上のクラスタは誤検知リスクが高いとみなし low に落とす
   */
  largeClusterThreshold: number;
}

export class TagMergePriorityResolver {
  private readonly hierarchyDetector = new HierarchyPriorityDetector();
  private readonly variantDetector = new VariantPriorityDetector();

  constructor(private readonly options: TagMergePriorityResolverOptions) {}

  resolve(
    clusterSize: number,
    toKey: string,
    fromKey: string,
  ): TagMergePriorityKey {
    // 1件クラスタは自動判定不可
    if (clusterSize <= 1) {
      return 'other';
    }

    // 大規模クラスタは誤検知リスク高
    if (clusterSize >= this.options.largeClusterThreshold) {
      return 'low';
    }

    // 強い階層一致
    if (this.hierarchyDetector.detect(toKey, fromKey)) {
      return 'high';
    }

    // 表記ゆれ・バリエーション
    // if (this.variantDetector.detect(toKey, fromKey)) {
    //   return 'middle';
    // }

    // それ以外は低優先度
    return 'middle';
  }
}
