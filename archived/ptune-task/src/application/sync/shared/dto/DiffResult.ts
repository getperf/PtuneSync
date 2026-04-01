// src/application/sync/DiffResult.ts

export interface DiffSummary {
  create: number;
  update: number;
  delete: number;
  errors: number;
  warnings: number;
}

export interface DiffData {
  summary: DiffSummary;
  errors: string[];
  warnings: string[];
}

export class DiffResult {
  constructor(
    readonly success: boolean,
    readonly summary: DiffSummary,
    readonly errors: string[],
    readonly warnings: string[],
    readonly errorMessage?: string,
  ) {}

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  hasWarnings(): boolean {
    return this.warnings.length > 0;
  }

  isValidationFailure(): boolean {
    return !this.success;
  }
}
