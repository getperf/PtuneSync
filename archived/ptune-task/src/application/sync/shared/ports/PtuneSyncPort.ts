// src/application/sync/shared/ports/PtuneSyncPort.ts

import { DiffResult } from "../dto/DiffResult";
import { PullQuery } from "../dto/PullQuery";
import { ReviewQuery } from "../dto/ReviewQuery";
import { PushQuery } from "../dto/PushQuery";

export interface DiffSummary {
  create: number;
  update: number;
  delete: number;
  errors: number;
  warnings: number;
}

export interface PtuneSyncPort {
  pull(query: PullQuery): Promise<string>;
  review(query: ReviewQuery): Promise<string>;
  diff(payload: string): Promise<DiffResult>;
  push(payload: string, query: PushQuery): Promise<void>;
}