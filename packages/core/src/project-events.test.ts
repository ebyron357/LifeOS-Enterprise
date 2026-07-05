import { describe, expect, it, vi } from 'vitest';
import { DomainEvent } from '../../shared-types/src';
import { AppEventBus } from './event-bus';
import {
  buildProjectArchivedEvent,
  buildProjectCreatedEvent,
  buildProjectDeletedEvent,
  buildProjectOwnerChangedEvent,
  buildProjectPriorityChangedEvent,
  buildProjectRestoredEvent,
  buildProjectStatusChangedEvent,
  buildProjectUpdatedEvent,
  PROJECT_EVENT_TYPES,
} from './project-events';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BUSINESS_UNIT_ID = 'bu_test-unit' as const;
const ACTOR_ID = 'usr_actor-1';
const PROJECT_ID = 'proj_test-1';

/** Assert the full DomainEvent envelope fields are present and valid. */
function assertEnvelope(event: DomainEvent, expectedEventType: string) {
  // eventId must be prefixed with "evt_"
  expect(event.eventId).toMatch(/^evt_/);

  // eventType discriminator
  expect(event.eventType).toBe(expectedEventType);

  // entity fields
  expect(event.entityId).toBe(PROJECT_ID);
  expect(event.entityType).toBe('Project');

  // businessUnitId must be prefixed with "bu_"
  expect(event.businessUnitId).toMatch(/^bu_/);

  // occurredAt must be a valid UTC ISO 8601 timestamp
  expect(() => new Date(event.occurredAt)).not.toThrow();
  expect(new Date(event.occurredAt).toISOString()).toBe(event.occurredAt);

  // actorId
  expect(event.actorId).toBe(ACTOR_ID);

  // schemaVersion
  expect(event.schemaVersion).toBe('1.0');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('project events — envelope', () => {
  it('ProjectCreated has a valid envelope', () => {
    const event = buildProjectCreatedEvent({
      entityId: PROJECT_ID,
      businessUnitId: BUSINESS_UNIT_ID,
      actorId: ACTOR_ID,
      payload: {
        projectId: PROJECT_ID,
        name: 'Launch Campaign',
        status: 'active',
        ownerId: ACTOR_ID,
        businessUnitId: BUSINESS_UNIT_ID,
      },
    });
    assertEnvelope(event, PROJECT_EVENT_TYPES.CREATED);
  });

  it('each event gets a unique eventId', () => {
    const a = buildProjectCreatedEvent({
      entityId: PROJECT_ID,
      businessUnitId: BUSINESS_UNIT_ID,
      actorId: ACTOR_ID,
      payload: {
        projectId: PROJECT_ID,
        name: 'A',
        status: 'draft',
        ownerId: ACTOR_ID,
        businessUnitId: BUSINESS_UNIT_ID,
      },
    });
    const b = buildProjectCreatedEvent({
      entityId: PROJECT_ID,
      businessUnitId: BUSINESS_UNIT_ID,
      actorId: ACTOR_ID,
      payload: {
        projectId: PROJECT_ID,
        name: 'B',
        status: 'draft',
        ownerId: ACTOR_ID,
        businessUnitId: BUSINESS_UNIT_ID,
      },
    });
    expect(a.eventId).not.toBe(b.eventId);
  });

  it('correlationId is propagated when supplied', () => {
    const correlationId = 'corr_abc-123';
    const event = buildProjectStatusChangedEvent({
      entityId: PROJECT_ID,
      businessUnitId: BUSINESS_UNIT_ID,
      actorId: ACTOR_ID,
      correlationId,
      payload: { projectId: PROJECT_ID, previousStatus: 'draft', newStatus: 'active' },
    });
    expect(event.correlationId).toBe(correlationId);
  });

  it('correlationId is absent when not supplied', () => {
    const event = buildProjectStatusChangedEvent({
      entityId: PROJECT_ID,
      businessUnitId: BUSINESS_UNIT_ID,
      actorId: ACTOR_ID,
      payload: { projectId: PROJECT_ID, previousStatus: 'draft', newStatus: 'active' },
    });
    expect(event.correlationId).toBeUndefined();
  });

  it('custom schemaVersion is respected', () => {
    const event = buildProjectUpdatedEvent({
      entityId: PROJECT_ID,
      businessUnitId: BUSINESS_UNIT_ID,
      actorId: ACTOR_ID,
      schemaVersion: '2.0',
      payload: { projectId: PROJECT_ID, changedFields: { name: 'Renamed' } },
    });
    expect(event.schemaVersion).toBe('2.0');
  });
});

describe('project events — payloads', () => {
  it('ProjectCreated payload', () => {
    const event = buildProjectCreatedEvent({
      entityId: PROJECT_ID,
      businessUnitId: BUSINESS_UNIT_ID,
      actorId: ACTOR_ID,
      payload: {
        projectId: PROJECT_ID,
        name: 'Launch Campaign',
        goal: 'Increase revenue by 20%',
        nextAction: 'Draft brief',
        status: 'active',
        ownerId: ACTOR_ID,
        businessUnitId: BUSINESS_UNIT_ID,
      },
    });
    assertEnvelope(event, PROJECT_EVENT_TYPES.CREATED);
    expect(event.payload.projectId).toBe(PROJECT_ID);
    expect(event.payload.name).toBe('Launch Campaign');
    expect(event.payload.goal).toBe('Increase revenue by 20%');
    expect(event.payload.nextAction).toBe('Draft brief');
    expect(event.payload.status).toBe('active');
  });

  it('ProjectUpdated payload', () => {
    const event = buildProjectUpdatedEvent({
      entityId: PROJECT_ID,
      businessUnitId: BUSINESS_UNIT_ID,
      actorId: ACTOR_ID,
      payload: {
        projectId: PROJECT_ID,
        changedFields: { name: 'New Name', dueDate: '2026-12-31' },
      },
    });
    assertEnvelope(event, PROJECT_EVENT_TYPES.UPDATED);
    expect(event.payload.changedFields.name).toBe('New Name');
    expect(event.payload.changedFields.dueDate).toBe('2026-12-31');
  });

  it('ProjectArchived payload', () => {
    const event = buildProjectArchivedEvent({
      entityId: PROJECT_ID,
      businessUnitId: BUSINESS_UNIT_ID,
      actorId: ACTOR_ID,
      payload: { projectId: PROJECT_ID, archivedBy: ACTOR_ID },
    });
    assertEnvelope(event, PROJECT_EVENT_TYPES.ARCHIVED);
    expect(event.payload.archivedBy).toBe(ACTOR_ID);
  });

  it('ProjectRestored payload', () => {
    const event = buildProjectRestoredEvent({
      entityId: PROJECT_ID,
      businessUnitId: BUSINESS_UNIT_ID,
      actorId: ACTOR_ID,
      payload: { projectId: PROJECT_ID, restoredBy: ACTOR_ID },
    });
    assertEnvelope(event, PROJECT_EVENT_TYPES.RESTORED);
    expect(event.payload.restoredBy).toBe(ACTOR_ID);
  });

  it('ProjectStatusChanged payload', () => {
    const event = buildProjectStatusChangedEvent({
      entityId: PROJECT_ID,
      businessUnitId: BUSINESS_UNIT_ID,
      actorId: ACTOR_ID,
      payload: { projectId: PROJECT_ID, previousStatus: 'on_hold', newStatus: 'active' },
    });
    assertEnvelope(event, PROJECT_EVENT_TYPES.STATUS_CHANGED);
    expect(event.payload.previousStatus).toBe('on_hold');
    expect(event.payload.newStatus).toBe('active');
  });

  it('ProjectOwnerChanged payload', () => {
    const newOwner = 'usr_new-owner';
    const event = buildProjectOwnerChangedEvent({
      entityId: PROJECT_ID,
      businessUnitId: BUSINESS_UNIT_ID,
      actorId: ACTOR_ID,
      payload: { projectId: PROJECT_ID, previousOwnerId: ACTOR_ID, newOwnerId: newOwner },
    });
    assertEnvelope(event, PROJECT_EVENT_TYPES.OWNER_CHANGED);
    expect(event.payload.previousOwnerId).toBe(ACTOR_ID);
    expect(event.payload.newOwnerId).toBe(newOwner);
  });

  it('ProjectPriorityChanged payload', () => {
    const event = buildProjectPriorityChangedEvent({
      entityId: PROJECT_ID,
      businessUnitId: BUSINESS_UNIT_ID,
      actorId: ACTOR_ID,
      payload: { projectId: PROJECT_ID, previousPriority: 'low', newPriority: 'urgent' },
    });
    assertEnvelope(event, PROJECT_EVENT_TYPES.PRIORITY_CHANGED);
    expect(event.payload.previousPriority).toBe('low');
    expect(event.payload.newPriority).toBe('urgent');
  });

  it('ProjectDeleted payload (soft delete only)', () => {
    const deletedAt = new Date().toISOString();
    const event = buildProjectDeletedEvent({
      entityId: PROJECT_ID,
      businessUnitId: BUSINESS_UNIT_ID,
      actorId: ACTOR_ID,
      payload: { projectId: PROJECT_ID, deletedBy: ACTOR_ID, deletedAt },
    });
    assertEnvelope(event, PROJECT_EVENT_TYPES.DELETED);
    expect(event.payload.deletedBy).toBe(ACTOR_ID);
    // soft delete: deletedAt timestamp is present in payload
    expect(event.payload.deletedAt).toBe(deletedAt);
  });
});

describe('project events — consumability via AppEventBus', () => {
  it('all 8 project events are publishable and received by subscribers', async () => {
    const bus = new AppEventBus();
    const received: DomainEvent[] = [];

    for (const eventType of Object.values(PROJECT_EVENT_TYPES)) {
      bus.subscribe(eventType, async (evt) => {
        received.push(evt);
      });
    }

    const events: DomainEvent[] = [
      buildProjectCreatedEvent({
        entityId: PROJECT_ID,
        businessUnitId: BUSINESS_UNIT_ID,
        actorId: ACTOR_ID,
        payload: {
          projectId: PROJECT_ID,
          name: 'Test',
          status: 'draft',
          ownerId: ACTOR_ID,
          businessUnitId: BUSINESS_UNIT_ID,
        },
      }),
      buildProjectUpdatedEvent({
        entityId: PROJECT_ID,
        businessUnitId: BUSINESS_UNIT_ID,
        actorId: ACTOR_ID,
        payload: { projectId: PROJECT_ID, changedFields: { name: 'Updated' } },
      }),
      buildProjectArchivedEvent({
        entityId: PROJECT_ID,
        businessUnitId: BUSINESS_UNIT_ID,
        actorId: ACTOR_ID,
        payload: { projectId: PROJECT_ID, archivedBy: ACTOR_ID },
      }),
      buildProjectRestoredEvent({
        entityId: PROJECT_ID,
        businessUnitId: BUSINESS_UNIT_ID,
        actorId: ACTOR_ID,
        payload: { projectId: PROJECT_ID, restoredBy: ACTOR_ID },
      }),
      buildProjectStatusChangedEvent({
        entityId: PROJECT_ID,
        businessUnitId: BUSINESS_UNIT_ID,
        actorId: ACTOR_ID,
        payload: { projectId: PROJECT_ID, previousStatus: 'draft', newStatus: 'active' },
      }),
      buildProjectOwnerChangedEvent({
        entityId: PROJECT_ID,
        businessUnitId: BUSINESS_UNIT_ID,
        actorId: ACTOR_ID,
        payload: { projectId: PROJECT_ID, previousOwnerId: ACTOR_ID, newOwnerId: 'usr_new' },
      }),
      buildProjectPriorityChangedEvent({
        entityId: PROJECT_ID,
        businessUnitId: BUSINESS_UNIT_ID,
        actorId: ACTOR_ID,
        payload: { projectId: PROJECT_ID, previousPriority: 'medium', newPriority: 'high' },
      }),
      buildProjectDeletedEvent({
        entityId: PROJECT_ID,
        businessUnitId: BUSINESS_UNIT_ID,
        actorId: ACTOR_ID,
        payload: {
          projectId: PROJECT_ID,
          deletedBy: ACTOR_ID,
          deletedAt: new Date().toISOString(),
        },
      }),
    ];

    for (const event of events) {
      await bus.publish(event);
    }

    expect(received).toHaveLength(8);
    expect(received.map((e) => e.eventType)).toEqual(Object.values(PROJECT_EVENT_TYPES));
  });

  it('unrelated subscribers do not receive project events', async () => {
    const bus = new AppEventBus();
    const spy = vi.fn(async () => {});
    bus.subscribe('TaskCreated', spy);

    const event = buildProjectCreatedEvent({
      entityId: PROJECT_ID,
      businessUnitId: BUSINESS_UNIT_ID,
      actorId: ACTOR_ID,
      payload: {
        projectId: PROJECT_ID,
        name: 'Test',
        status: 'draft',
        ownerId: ACTOR_ID,
        businessUnitId: BUSINESS_UNIT_ID,
      },
    });

    await bus.publish(event);
    expect(spy).not.toHaveBeenCalled();
  });
});
