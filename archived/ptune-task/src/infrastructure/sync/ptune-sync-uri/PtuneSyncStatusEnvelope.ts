export interface PtuneSyncStatusError {
  type: string;
  message: string;
}

export interface PtuneSyncStatusEnvelope<TData = unknown> {
  version: number;
  timestamp: string;
  status: "running" | "success" | "error";
  success?: boolean;
  command?: string;
  data?: TData;
  error?: PtuneSyncStatusError;
  meta?: Record<string, unknown>;
}
