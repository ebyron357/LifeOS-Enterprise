import { DomainEvent } from '../../shared-types/src';

type EventHandler = (event: DomainEvent) => Promise<void>;

export class AppEventBus {
  private readonly handlers = new Map<string, EventHandler[]>();

  subscribe(type: string, handler: EventHandler) {
    const current = this.handlers.get(type) ?? [];
    this.handlers.set(type, [...current, handler]);
  }

  async publish(event: DomainEvent) {
    const handlers = this.handlers.get(event.type) ?? [];
    await Promise.all(handlers.map(async (handler) => handler(event)));
  }
}
