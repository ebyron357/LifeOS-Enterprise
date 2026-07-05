export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function toAppError(error: unknown, fallbackCode = 'UNEXPECTED_ERROR') {
  if (error instanceof AppError) {
    return error;
  }

  return new AppError('Unexpected failure', fallbackCode, error);
}
