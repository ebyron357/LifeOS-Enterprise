import { DomainEvent } from '../../../packages/shared-types/src';
import { AppEventBus, createLogger, startSpan, endSpan } from '../../../packages/core/src';

const logger = createLogger(process.env['LOG_LEVEL'] ?? 'info');
const bus = new AppEventBus();

bus.subscribe('worker.tick', async (event: DomainEvent) => {
  const span = startSpan('worker.tick');
  logger.info({ event }, 'worker received tick');
  endSpan(span);
});

void bus.publish({
  type: 'worker.tick',
  payload: { bootstrapped: true },
  occurredAt: new Date().toISOString(),
});
