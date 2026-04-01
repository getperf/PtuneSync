import { DailyNoteRepository } from "../../../infrastructure/repository/DailyNoteRepository";
import { logger } from "../../../shared/logger/loggerInstance";
import { MarkdownToJsonUseCase } from "../../planning/usecases/MarkdownToJsonUseCase";
import { DiffResult } from "../shared/dto/DiffResult";
import { PtuneSyncPort } from "../shared/ports/PtuneSyncPort";

export interface DiffExecutionResult {
  payload: string;
  result: DiffResult;
}

export class DiffDailyNoteUseCase {
  constructor(
    private readonly repository: DailyNoteRepository,
    private readonly syncPort: PtuneSyncPort,
  ) {}

  async execute(): Promise<DiffExecutionResult> {
    logger.debug("[UseCase:start] DiffDailyNoteUseCase");

    const note = await this.repository.getActive();
    const payload = MarkdownToJsonUseCase.execute(note.content);
    logger.debug(
      `[UseCase] DiffDailyNoteUseCase activePath=${note.filePath} payloadBytes=${payload.length}`,
    );

    const result = await this.syncPort.diff(payload);

    if (result.isValidationFailure()) {
      logger.warn(
        `[UseCase] DiffDailyNoteUseCase validationFailed errors=${result.errors.length}`,
        result.errors,
      );
    } else {
      logger.debug(
        `[UseCase:end] DiffDailyNoteUseCase create=${result.summary.create} update=${result.summary.update} delete=${result.summary.delete} errors=${result.summary.errors} warnings=${result.summary.warnings}`,
      );
    }

    return { payload, result };
  }
}
