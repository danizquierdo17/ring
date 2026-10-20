export type AppErrorCode =
  | "CYCLE_ALREADY_ACTIVE"
  | "CYCLE_NOT_ACTIVE"
  | "CYCLE_NOT_FOUND"
  | "INVALID_DATE"
  | "DB_ERROR"
  | "PERMISSION_DENIED"
  | "INVALID_REGIMEN"
  | "INVALID_CONTINUOUS_DAYS"
  | "INVALID_LOCALE"
  | "INVALID_STOCK_COUNT"
  | "INVALID_STOCK_THRESHOLD"
  | "INVALID_BUY_REMINDER_HOURS";

export type AppError = {
  readonly code: AppErrorCode;
  readonly message: string;
};
