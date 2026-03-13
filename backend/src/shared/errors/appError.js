export class AppError extends Error {
  constructor(message, statusCode = 400, code = "APP_ERROR") {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function asAppError(error) {
  if (error instanceof AppError) {
    return error;
  }

  return new AppError(error?.message || "Unexpected application error", 500, "UNEXPECTED_ERROR");
}
