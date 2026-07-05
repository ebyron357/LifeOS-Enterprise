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
      eventId: 'evt_health-1',
      eventType: 'health.ping',
      entityId: 'system',
      entityType: 'System',
      businessUnitId: 'bu_system',
      occurredAt: new Date().toISOString(),
      actorId: 'system',
      schemaVersion: '1.0',
      payload: { ok: true },
    });
    expect(handled).toBe(true);
  });
});
