import { SyncPhase } from "../../../domain/task/SyncPhase";
import { i18n } from "../../../shared/i18n/I18n";
import { PushConfirmationSummary } from "./dto/PushConfirmationSummary";

type DiffSummary = PushConfirmationSummary["diff"];

export class PushConfirmationSummaryBuilder {
  build(
    phase: SyncPhase,
    diff: DiffSummary,
  ): PushConfirmationSummary {
    const t = i18n.common.push.confirm;

    if (phase === SyncPhase.Planning) {
      return {
        phase,
        warningLevel: "warning",
        title: t.planning.title,
        message: t.planning.message,
        diff,
      };
    }

    return {
      phase,
      warningLevel: "info",
      title: t.working.title,
      message: t.working.message,
      diff,
    };
  }
}
