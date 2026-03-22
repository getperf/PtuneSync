import { logger } from "../../../shared/logger/loggerInstance";
import { SyncPhase } from "../../../domain/task/SyncPhase";
import { DiffResult } from "../shared/dto/DiffResult";
import { DiffDailyNoteUseCase } from "../diff/DiffDailyNoteUseCase";
import { ApplyPushUseCase } from "./ApplyPushUseCase";
import { PushConfirmationSummaryBuilder } from "./PushConfirmationSummaryBuilder";
import { PushConfirmationSummary } from "./dto/PushConfirmationSummary";

export interface ConfirmPort {
  confirm(summary: PushConfirmationSummary): Promise<boolean>;
}

export class PushSyncUseCase {
  constructor(
    private readonly diffUseCase: DiffDailyNoteUseCase,
    private readonly pushUseCase: ApplyPushUseCase,
    private readonly confirmPort: ConfirmPort,
    private readonly summaryBuilder = new PushConfirmationSummaryBuilder(),
  ) { }

  async execute(
    phase: SyncPhase,
    allowDelete: boolean,
  ): Promise<DiffResult | false> {
    logger.debug(`[UseCase:start] PushSyncUseCase phase=${phase} allowDelete=${allowDelete}`);

    const { payload, result } = await this.diffUseCase.execute();

    logger.debug(
      `[UseCase] PushSyncUseCase diffReady payloadBytes=${payload.length} create=${result.summary.create} update=${result.summary.update} delete=${result.summary.delete} errors=${result.summary.errors} warnings=${result.summary.warnings}`,
    );

    // 🔹 バリデーション失敗は例外にしない
    if (result.isValidationFailure()) {
      logger.warn(`[UseCase] PushSyncUseCase validationFailure errors=${result.errors.length}`, result.errors);
      return result;
    }

    // 🔹 summary取得
    const summary = result.summary;

    // 🔹 errorsがあればpush不可
    if (result.hasErrors()) {
      logger.warn(`[UseCase] PushSyncUseCase blockedByErrors errors=${result.errors.length}`, result.errors);
      return result;
    }

    const confirmation = this.summaryBuilder.build(phase, summary);
    const confirmed = await this.confirmPort.confirm(confirmation);
    logger.debug(`[UseCase] PushSyncUseCase confirmed=${confirmed}`);

    if (!confirmed) {
      logger.info("[UseCase:end] PushSyncUseCase cancelledByUser");
      return false;
    }

    await this.pushUseCase.execute(payload, allowDelete);

    logger.debug("[UseCase:end] PushSyncUseCase pushed=true");

    return result;
  }
}
