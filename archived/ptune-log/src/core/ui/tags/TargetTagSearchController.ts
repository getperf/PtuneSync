// File: src/core/ui/tags/TargetTagSearchController.ts

import { TagCandidate } from 'src/core/models/tags/TagCandidate';
import { logger } from 'src/core/services/logger/loggerInstance';

export type SearchMode = 'normal' | 'vector';

export interface TargetTagSearchPort {
  searchNormal: (q: string) => Promise<TagCandidate[]>;
  searchVector?: (q: string) => Promise<TagCandidate[]>;
  vectorAvailable: boolean;
}

export class TargetTagSearchController {
  constructor(private readonly port: TargetTagSearchPort) {}

  canUseVector(): boolean {
    return this.port.vectorAvailable;
  }

  async search(mode: SearchMode, keyword: string): Promise<TagCandidate[]> {
    const key = keyword.trim();

    if (mode === 'vector') {
      if (!this.port.vectorAvailable || !this.port.searchVector) {
        logger.debug('[TargetTagSearchController] vector unavailable');
        return [];
      }
      logger.debug('[TargetTagSearchController] vector search');
      return this.port.searchVector(key);
    }

    logger.debug('[TargetTagSearchController] normal search');
    return this.port.searchNormal(key);
  }
}
