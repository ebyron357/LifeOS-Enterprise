import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createContainer } from './di';
import { AppError, toAppError } from './errors';
import { AppEventBus } from './event-bus';
import { evaluateHealth } from './health';
import { createLogger } from './logging';
import { endSpan, startSpan } from './observability';
import { validate } from './validation';
import { authenticateBearerToken } from './auth';

const getUserMock = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: getUserMock,
    },
  }),
}));

describe('core infrastructure', () => {
  beforeEach(() => {
    getUserMock.mockReset();
  });

  it('creates DI container', () => {
    const container = createContainer();
    expect(container).toBeDefined();
  });

  it('normalizes unknown errors', () => {
    const wrapped = toAppError(new Error('boom'));
    expect(wrapped).toBeInstanceOf(AppError);

    const original = new AppError('x', 'X');
    expect(toAppError(original)).toBe(original);
  });

  it('publishes events', async () => {
    const bus = new AppEventBus();
    const spy = vi.fn(async () => {});
    bus.subscribe('test.event', spy);

    await bus.publish({
      type: 'test.event',
      payload: { ok: true },
      occurredAt: new Date().toISOString(),
    });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('evaluates aggregated health', async () => {
    const result = await evaluateHealth([
      { name: 'db', check: async () => 'ok' as const },
      { name: 'cache', check: async () => 'degraded' as const },
    ]);

    expect(result.status).toBe('degraded');
    expect(result.checks).toHaveLength(2);
  });

  it('creates logger with redaction', () => {
    const logger = createLogger('debug');
    expect(logger.level).toBe('debug');
  });

  it('tracks span lifecycle', () => {
    const span = startSpan('request', { source: 'test' });
    const closed = endSpan(span);

    expect(closed.endedAt).toBeTypeOf('number');
    expect(closed.attributes?.['source']).toBe('test');
  });

  it('validates input data', () => {
    const schema = z.object({ id: z.string() });
    const valid = validate(schema, { id: '1' });
    expect(valid.id).toBe('1');

    expect(() => validate(schema, {})).toThrow(AppError);
  });

  it('authenticates bearer tokens', async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'user@example.com' } },
      error: null,
    });

    const user = await authenticateBearerToken({
      supabaseUrl: 'https://example.supabase.co',
      supabaseServiceRoleKey: 'service-role-key-1234567890',
      bearerToken: 'token',
    });

    expect(user.userId).toBe('user-1');
  });

  it('rejects missing or invalid tokens', async () => {
    await expect(
      authenticateBearerToken({
        supabaseUrl: 'https://example.supabase.co',
        supabaseServiceRoleKey: 'service-role-key-1234567890',
      }),
    ).rejects.toBeInstanceOf(AppError);

    getUserMock.mockResolvedValue({ data: { user: null }, error: new Error('invalid') });

    await expect(
      authenticateBearerToken({
        supabaseUrl: 'https://example.supabase.co',
        supabaseServiceRoleKey: 'service-role-key-1234567890',
        bearerToken: 'token',
      }),
    ).rejects.toBeInstanceOf(AppError);
  });
});
