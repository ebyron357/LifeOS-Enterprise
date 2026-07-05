import { describe, expect, it } from 'vitest';
import { AppEventBus } from '../../packages/core/src/event-bus';

describe('core event bus', () => {
  it('dispatches events to subscribers', async () => {
    const bus = new AppEventBus();
    let handled = false;

    bus.subscribe('health.ping', async () => {
      handled = true;
    });

    await bus.publish({
      type: 'health.ping',
      payload: { ok: true },
      occurredAt: new Date().toISOString(),
    });
    expect(handled).toBe(true);
  });
});
