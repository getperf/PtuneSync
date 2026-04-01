import { logger } from "src/core/services/logger/loggerInstance";

export function createAndLogError(
  message: string,
  meta?: Record<string, unknown>
): Error {
  logger.error(message, meta);
  return new Error(message);
}
