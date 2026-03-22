// File: src/core/ui/tags/TargetTagSearchPort.ts

import { TagCandidate } from 'src/core/models/tags/TagCandidate';

export interface TargetTagSearchPort {
  /** 通常検索（必須） */
  searchNormal(query: string): Promise<TagCandidate[]>;

  /** ベクトル検索（任意） */
  searchVector?(query: string): Promise<TagCandidate[]>;

  /** ベクトル検索が利用可能か */
  isVectorAvailable(): boolean;
}
