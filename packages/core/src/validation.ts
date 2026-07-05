import { z } from 'zod';
import { AppError } from './errors';

export function validate<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    throw new AppError('Validation failed', 'VALIDATION_ERROR', parsed.error.flatten());
  }

  return parsed.data;
}
