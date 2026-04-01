import { logger } from "../../../shared/logger/loggerInstance";
import { getDefaultTaskListId } from "../shared/DefaultTaskListId";
import { PtuneSyncPort } from "../shared/ports/PtuneSyncPort";

export class ApplyPushUseCase {
  constructor(private readonly syncPort: PtuneSyncPort) { }

  async execute(payload: string, allowDelete: boolean): Promise<void> {
    logger.info("Push started");

    try {
      await this.syncPort.push(payload, { list: getDefaultTaskListId(), allowDelete });

      logger.info("Push completed");
    } catch (error) {
      logger.error("Push failed", error);
      throw error;
    }
  }
}
