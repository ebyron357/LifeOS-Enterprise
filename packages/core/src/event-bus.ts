import { DomainEvent } from '../../shared-types/src';

type EventHandler = (event: DomainEvent) => Promise<void>;

export class AppEventBus {
  private readonly handlers = new Map<string, EventHandler[]>();

  subscribe(eventType: string, handler: EventHandler) {
    const current = this.handlers.get(eventType) ?? [];
    this.handlers.set(eventType, [...current, handler]);
  }

  async publish(event: DomainEvent) {
    const handlers = this.handlers.get(event.eventType) ?? [];
    await Promise.all(handlers.map(async (handler) => handler(event)));
  }
}
