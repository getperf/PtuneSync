import { SyncPhase } from "../../../../domain/task/SyncPhase";

export type PushConfirmationSummary = {
  phase: SyncPhase;
  warningLevel: "info" | "warning";
  title: string;
  message: string;
  diff: {
    create: number;
    update: number;
    delete: number;
    errors: number;
    warnings: number;
  };
};
