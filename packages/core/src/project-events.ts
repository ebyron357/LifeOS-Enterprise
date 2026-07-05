import { randomUUID } from 'crypto';
import { DomainEvent } from '../../shared-types/src';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProjectStatus = 'active' | 'on_hold' | 'complete' | 'cancelled' | 'draft';
export type ProjectPriority = 'urgent' | 'high' | 'medium' | 'low';

// ---------------------------------------------------------------------------
// Event type constants
// ---------------------------------------------------------------------------

export const PROJECT_EVENT_TYPES = {
  CREATED: 'ProjectCreated',
  UPDATED: 'ProjectUpdated',
  ARCHIVED: 'ProjectArchived',
  RESTORED: 'ProjectRestored',
  STATUS_CHANGED: 'ProjectStatusChanged',
  OWNER_CHANGED: 'ProjectOwnerChanged',
  PRIORITY_CHANGED: 'ProjectPriorityChanged',
  DELETED: 'ProjectDeleted',
} as const;

export type ProjectEventType = (typeof PROJECT_EVENT_TYPES)[keyof typeof PROJECT_EVENT_TYPES];

// ---------------------------------------------------------------------------
// Payload interfaces
// ---------------------------------------------------------------------------

export interface ProjectCreatedPayload {
  projectId: string;
  name: string;
  goal?: string;
  nextAction?: string;
  status: ProjectStatus;
  ownerId: string;
  businessUnitId: string;
}

export interface ProjectUpdatedPayload {
  projectId: string;
  changedFields: Partial<{
    name: string;
    goal: string | null;
    nextAction: string | null;
    dueDate: string | null;
    tags: string[];
  }>;
}

export interface ProjectArchivedPayload {
  projectId: string;
  archivedBy: string;
}

export interface ProjectRestoredPayload {
  projectId: string;
  restoredBy: string;
}

export interface ProjectStatusChangedPayload {
  projectId: string;
  previousStatus: ProjectStatus;
  newStatus: ProjectStatus;
}

export interface ProjectOwnerChangedPayload {
  projectId: string;
  previousOwnerId: string;
  newOwnerId: string;
}

export interface ProjectPriorityChangedPayload {
  projectId: string;
  previousPriority: ProjectPriority;
  newPriority: ProjectPriority;
}

/** Soft-delete only — the entity is never physically removed. */
export interface ProjectDeletedPayload {
  projectId: string;
  deletedBy: string;
  deletedAt: string;
}

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

interface ProjectEventOptions<TPayload> {
  entityId: string;
  businessUnitId: `bu_${string}`;
  actorId: string;
  schemaVersion?: string;
  correlationId?: string;
  payload: TPayload;
}

function createProjectEvent<TPayload>(
  eventType: ProjectEventType,
  opts: ProjectEventOptions<TPayload>,
): DomainEvent<TPayload> {
  return {
    eventId: `evt_${randomUUID()}`,
    eventType,
    entityId: opts.entityId,
    entityType: 'Project',
    businessUnitId: opts.businessUnitId,
    occurredAt: new Date().toISOString(),
    actorId: opts.actorId,
    schemaVersion: opts.schemaVersion ?? '1.0',
    ...(opts.correlationId !== undefined ? { correlationId: opts.correlationId } : {}),
    payload: opts.payload,
  };
}

export function buildProjectCreatedEvent(
  opts: ProjectEventOptions<ProjectCreatedPayload>,
): DomainEvent<ProjectCreatedPayload> {
  return createProjectEvent(PROJECT_EVENT_TYPES.CREATED, opts);
}

export function buildProjectUpdatedEvent(
  opts: ProjectEventOptions<ProjectUpdatedPayload>,
): DomainEvent<ProjectUpdatedPayload> {
  return createProjectEvent(PROJECT_EVENT_TYPES.UPDATED, opts);
}

export function buildProjectArchivedEvent(
  opts: ProjectEventOptions<ProjectArchivedPayload>,
): DomainEvent<ProjectArchivedPayload> {
  return createProjectEvent(PROJECT_EVENT_TYPES.ARCHIVED, opts);
}

export function buildProjectRestoredEvent(
  opts: ProjectEventOptions<ProjectRestoredPayload>,
): DomainEvent<ProjectRestoredPayload> {
  return createProjectEvent(PROJECT_EVENT_TYPES.RESTORED, opts);
}

export function buildProjectStatusChangedEvent(
  opts: ProjectEventOptions<ProjectStatusChangedPayload>,
): DomainEvent<ProjectStatusChangedPayload> {
  return createProjectEvent(PROJECT_EVENT_TYPES.STATUS_CHANGED, opts);
}

export function buildProjectOwnerChangedEvent(
  opts: ProjectEventOptions<ProjectOwnerChangedPayload>,
): DomainEvent<ProjectOwnerChangedPayload> {
  return createProjectEvent(PROJECT_EVENT_TYPES.OWNER_CHANGED, opts);
}

export function buildProjectPriorityChangedEvent(
  opts: ProjectEventOptions<ProjectPriorityChangedPayload>,
): DomainEvent<ProjectPriorityChangedPayload> {
  return createProjectEvent(PROJECT_EVENT_TYPES.PRIORITY_CHANGED, opts);
}

export function buildProjectDeletedEvent(
  opts: ProjectEventOptions<ProjectDeletedPayload>,
): DomainEvent<ProjectDeletedPayload> {
  return createProjectEvent(PROJECT_EVENT_TYPES.DELETED, opts);
}
