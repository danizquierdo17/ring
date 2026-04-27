export type AppErrorCode =
  | "CYCLE_ALREADY_ACTIVE"
  | "CYCLE_NOT_ACTIVE"
  | "CYCLE_NOT_FOUND"
  | "INVALID_DATE"
  | "DB_ERROR";

export type AppError = {
  readonly code: AppErrorCode;
  readonly message: string;
};
