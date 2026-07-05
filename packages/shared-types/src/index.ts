export type HealthStatus = 'ok' | 'degraded' | 'down';

export interface DomainEvent<TPayload = unknown> {
  type: string;
  payload: TPayload;
  occurredAt: string;
}

export interface Repository<T, TId> {
  findById(id: TId): Promise<T | null>;
  save(entity: T): Promise<T>;
}
