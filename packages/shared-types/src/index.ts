export type HealthStatus = 'ok' | 'degraded' | 'down';

/**
 * Full event envelope as defined in docs/schemas/event-schemas.md.
 * Every domain event emitted by the platform must conform to this shape.
 */
export interface DomainEvent<TPayload = unknown> {
  /** Unique identifier for this event instance, prefixed with "evt_". */
  eventId: `evt_${string}`;
  /** Discriminator used to route and filter events (e.g., "ProjectCreated"). */
  eventType: string;
  /** ID of the primary entity this event describes. */
  entityId: string;
  /** Entity type name (e.g., "Project", "Task"). */
  entityType: string;
  /** Business unit scope for the event. */
  businessUnitId: `bu_${string}`;
  /** UTC ISO 8601 timestamp of when the event occurred. */
  occurredAt: string;
  /** Actor (user or agent) that caused the event, e.g. "usr_…" or "agent_…". */
  actorId: string;
  /** Payload schema version, e.g. "1.0". Increment on breaking payload changes. */
  schemaVersion: string;
  /**
   * Optional correlation ID for tracing a chain of related events across
   * multiple domain actions (required by automation and AI consumers).
   */
  correlationId?: string;
  payload: TPayload;
}

export interface Repository<T, TId> {
  findById(id: TId): Promise<T | null>;
  save(entity: T): Promise<T>;
}
