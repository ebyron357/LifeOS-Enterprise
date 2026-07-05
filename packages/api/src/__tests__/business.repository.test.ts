/**
 * InMemoryBusinessRepository — Integration Tests
 *
 * Tests the full repository interface using the in-memory implementation.
 * No mocking: all interactions go through the real implementation.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryBusinessRepository } from '../services/business/business.repository.js'
import type { BusinessRecord, CreateKPIData } from '../services/business/types.js'

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const ORG_ID = 'org-test-001'
const USER_ID = 'user-test-001'

function makeBusinessData(
  overrides: Partial<Omit<BusinessRecord, 'id' | 'created_at' | 'updated_at' | 'version'>> = {},
): Omit<BusinessRecord, 'id' | 'created_at' | 'updated_at' | 'version'> {
  return {
    business_key: 'BIZ-TEST01',
    org_id: ORG_ID,
    name: 'Test Business',
    slug: 'test-business',
    status: 'Active',
    owner_id: USER_ID,
    tags: [],
    metadata: {},
    archived: false,
    ...overrides,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BUSINESS CRUD
// ─────────────────────────────────────────────────────────────────────────────

describe('InMemoryBusinessRepository — CRUD', () => {
  let repo: InMemoryBusinessRepository

  beforeEach(() => {
    repo = new InMemoryBusinessRepository()
  })

  it('creates a business and returns it with generated ID and timestamps', async () => {
    const data = makeBusinessData()
    const record = await repo.create(data)

    expect(record.id).toBeTruthy()
    expect(record.name).toBe('Test Business')
    expect(record.business_key).toBe('BIZ-TEST01')
    expect(record.org_id).toBe(ORG_ID)
    expect(record.version).toBe(1)
    expect(record.created_at).toBeTruthy()
    expect(record.updated_at).toBeTruthy()
  })

  it('finds by internal ID', async () => {
    const created = await repo.create(makeBusinessData())
    const found = await repo.findById(created.id, ORG_ID)

    expect(found).not.toBeNull()
    expect(found!.id).toBe(created.id)
  })

  it('returns null for non-existent ID', async () => {
    const found = await repo.findById('non-existent', ORG_ID)
    expect(found).toBeNull()
  })

  it('returns null when org_id does not match', async () => {
    const created = await repo.create(makeBusinessData())
    const found = await repo.findById(created.id, 'other-org')
    expect(found).toBeNull()
  })

  it('finds by business key', async () => {
    await repo.create(makeBusinessData({ business_key: 'BIZ-ALPHA1' }))
    const found = await repo.findByKey('BIZ-ALPHA1', ORG_ID)

    expect(found).not.toBeNull()
    expect(found!.business_key).toBe('BIZ-ALPHA1')
  })

  it('returns null for key in different org', async () => {
    await repo.create(makeBusinessData({ business_key: 'BIZ-ALPHA1' }))
    const found = await repo.findByKey('BIZ-ALPHA1', 'other-org')
    expect(found).toBeNull()
  })

  it('updates a business and increments version', async () => {
    const created = await repo.create(makeBusinessData())
    const updated = await repo.update(created.id, ORG_ID, { name: 'Updated Name', status: 'Scaling' })

    expect(updated.name).toBe('Updated Name')
    expect(updated.status).toBe('Scaling')
    expect(updated.version).toBe(2)
  })

  it('throws when updating a non-existent business', async () => {
    await expect(
      repo.update('non-existent', ORG_ID, { name: 'New Name' }),
    ).rejects.toThrow('Business not found')
  })

  it('archives a business', async () => {
    const created = await repo.create(makeBusinessData())
    const archived = await repo.archive(created.id, ORG_ID, USER_ID, 'Closing down')

    expect(archived.archived).toBe(true)
    expect(archived.archived_by).toBe(USER_ID)
    expect(archived.archive_reason).toBe('Closing down')
    expect(archived.archived_at).toBeTruthy()
  })

  it('restores an archived business', async () => {
    const created = await repo.create(makeBusinessData())
    const archived = await repo.archive(created.id, ORG_ID, USER_ID)
    const restored = await repo.restore(archived.id, ORG_ID, USER_ID)

    expect(restored.archived).toBe(false)
    expect(restored.archived_at).toBeUndefined()
    expect(restored.archived_by).toBeUndefined()
  })

  it('soft deletes a business', async () => {
    const created = await repo.create(makeBusinessData())
    await repo.softDelete(created.id, ORG_ID)

    const found = await repo.findById(created.id, ORG_ID)
    expect(found).toBeNull()
  })

  it('checks slug existence', async () => {
    await repo.create(makeBusinessData({ slug: 'existing-slug' }))

    expect(await repo.slugExists('existing-slug', ORG_ID)).toBe(true)
    expect(await repo.slugExists('non-existent-slug', ORG_ID)).toBe(false)
    expect(await repo.slugExists('existing-slug', 'other-org')).toBe(false)
  })

  it('excludes ID from slug check when updating', async () => {
    const created = await repo.create(makeBusinessData({ slug: 'my-slug' }))
    // Same slug is OK when excluding the same ID (for updates)
    expect(await repo.slugExists('my-slug', ORG_ID, created.id)).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// PAGINATION AND FILTERING
// ─────────────────────────────────────────────────────────────────────────────

describe('InMemoryBusinessRepository — findMany', () => {
  let repo: InMemoryBusinessRepository

  beforeEach(async () => {
    repo = new InMemoryBusinessRepository()

    await repo.create(makeBusinessData({ name: 'Alpha Corp', slug: 'alpha', status: 'Active', tags: ['saas'], business_key: 'BIZ-ALPH1' }))
    await repo.create(makeBusinessData({ name: 'Beta Ltd', slug: 'beta', status: 'Pre-Launch', tags: ['startup'], business_key: 'BIZ-BETA1' }))
    await repo.create(makeBusinessData({ name: 'Gamma Inc', slug: 'gamma', status: 'Active', tags: ['saas', 'enterprise'], business_key: 'BIZ-GAMM1' }))
    await repo.create(makeBusinessData({ name: 'Delta Co', slug: 'delta', status: 'Paused', tags: [], business_key: 'BIZ-DELT1' }))
  })

  it('returns all active businesses with default filter', async () => {
    const result = await repo.findMany({
      org_id: ORG_ID,
      page: 1,
      per_page: 25,
      sort_field: 'name',
      sort_order: 'asc',
      filter: { archived: false },
    })

    expect(result.total).toBe(4)
    expect(result.items).toHaveLength(4)
    expect(result.items[0]?.name).toBe('Alpha Corp')
  })

  it('filters by status', async () => {
    const result = await repo.findMany({
      org_id: ORG_ID,
      page: 1,
      per_page: 25,
      sort_field: 'name',
      sort_order: 'asc',
      filter: { status: ['Active'], archived: false },
    })

    expect(result.total).toBe(2)
    expect(result.items.every((b) => b.status === 'Active')).toBe(true)
  })

  it('filters by tags', async () => {
    const result = await repo.findMany({
      org_id: ORG_ID,
      page: 1,
      per_page: 25,
      sort_field: 'name',
      sort_order: 'asc',
      filter: { tags: ['saas'], archived: false },
    })

    expect(result.total).toBe(2)
  })

  it('paginates results correctly', async () => {
    const page1 = await repo.findMany({
      org_id: ORG_ID,
      page: 1,
      per_page: 2,
      sort_field: 'name',
      sort_order: 'asc',
      filter: { archived: false },
    })

    const page2 = await repo.findMany({
      org_id: ORG_ID,
      page: 2,
      per_page: 2,
      sort_field: 'name',
      sort_order: 'asc',
      filter: { archived: false },
    })

    expect(page1.items).toHaveLength(2)
    expect(page2.items).toHaveLength(2)
    expect(page1.has_more).toBe(true)
    expect(page2.has_more).toBe(false)
    expect(page1.items[0]?.name).not.toBe(page2.items[0]?.name)
  })

  it('sorts by name descending', async () => {
    const result = await repo.findMany({
      org_id: ORG_ID,
      page: 1,
      per_page: 25,
      sort_field: 'name',
      sort_order: 'desc',
      filter: { archived: false },
    })

    expect(result.items[0]?.name).toBe('Gamma Inc')
  })

  it('returns empty result for different org', async () => {
    const result = await repo.findMany({
      org_id: 'other-org',
      page: 1,
      per_page: 25,
      sort_field: 'name',
      sort_order: 'asc',
    })

    expect(result.total).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH
// ─────────────────────────────────────────────────────────────────────────────

describe('InMemoryBusinessRepository — search', () => {
  let repo: InMemoryBusinessRepository

  beforeEach(async () => {
    repo = new InMemoryBusinessRepository()
    await repo.create(makeBusinessData({ name: 'TradeIQ Platform', description: 'Trading analytics SaaS', slug: 'tradeiq', business_key: 'BIZ-TIQ01' }))
    await repo.create(makeBusinessData({ name: 'ClientVerse CRM', description: 'Client management system', slug: 'clientverse', business_key: 'BIZ-CV001', tags: ['crm'] }))
    await repo.create(makeBusinessData({ name: 'Alternative Media', description: 'Media and content platform', slug: 'alternative', business_key: 'BIZ-ALT01' }))
  })

  it('finds businesses by name', async () => {
    const result = await repo.search({ org_id: ORG_ID, query: 'tradeiq', limit: 10 })
    expect(result.items).toHaveLength(1)
    expect(result.items[0]?.name).toBe('TradeIQ Platform')
  })

  it('finds businesses by description', async () => {
    const result = await repo.search({ org_id: ORG_ID, query: 'analytics', limit: 10 })
    expect(result.items).toHaveLength(1)
    expect(result.items[0]?.name).toBe('TradeIQ Platform')
  })

  it('finds businesses by tag', async () => {
    const result = await repo.search({ org_id: ORG_ID, query: 'crm', limit: 10 })
    expect(result.items).toHaveLength(1)
  })

  it('returns empty when no match', async () => {
    const result = await repo.search({ org_id: ORG_ID, query: 'nonexistent-xyz-123', limit: 10 })
    expect(result.items).toHaveLength(0)
    expect(result.total).toBe(0)
  })

  it('respects limit', async () => {
    const result = await repo.search({ org_id: ORG_ID, query: 'a', limit: 2 })
    expect(result.items.length).toBeLessThanOrEqual(2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// VERSION HISTORY
// ─────────────────────────────────────────────────────────────────────────────

describe('InMemoryBusinessRepository — version history', () => {
  let repo: InMemoryBusinessRepository

  beforeEach(() => {
    repo = new InMemoryBusinessRepository()
  })

  it('saves and retrieves versions', async () => {
    const business = await repo.create(makeBusinessData())
    await repo.saveVersion(business.id, 1, business, USER_ID, 'Initial creation')

    const updated = await repo.update(business.id, ORG_ID, { name: 'Updated' })
    await repo.saveVersion(updated.id, 2, updated, USER_ID, 'Name updated')

    const history = await repo.getVersionHistory(business.id, ORG_ID, 10)
    expect(history).toHaveLength(2)
    expect(history[0]?.version).toBe(2) // most recent first
    expect(history[1]?.version).toBe(1)
  })

  it('retrieves a specific version', async () => {
    const business = await repo.create(makeBusinessData())
    await repo.saveVersion(business.id, 1, business, USER_ID, 'v1')

    const v1 = await repo.getVersionAt(business.id, 1, ORG_ID)
    expect(v1).not.toBeNull()
    expect(v1!.version).toBe(1)
    expect(v1!.changed_by).toBe(USER_ID)
  })

  it('returns null for non-existent version', async () => {
    const business = await repo.create(makeBusinessData())
    const v5 = await repo.getVersionAt(business.id, 5, ORG_ID)
    expect(v5).toBeNull()
  })

  it('limits version history', async () => {
    const business = await repo.create(makeBusinessData())
    for (let i = 1; i <= 5; i++) {
      await repo.saveVersion(business.id, i, business, USER_ID, `Version ${i}`)
    }
    const history = await repo.getVersionHistory(business.id, ORG_ID, 3)
    expect(history).toHaveLength(3)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// KPIs
// ─────────────────────────────────────────────────────────────────────────────

describe('InMemoryBusinessRepository — KPIs', () => {
  let repo: InMemoryBusinessRepository
  let businessId: string

  beforeEach(async () => {
    repo = new InMemoryBusinessRepository()
    const biz = await repo.create(makeBusinessData())
    businessId = biz.id
  })

  function makeKPI(overrides: Partial<CreateKPIData> = {}): CreateKPIData {
    return {
      business_id: businessId,
      business_key: 'BIZ-TEST01',
      org_id: ORG_ID,
      name: 'Monthly Revenue',
      unit: 'currency',
      direction: 'higher_is_better',
      measurement_period: 'monthly',
      target_value: 100_000,
      tags: [],
      ...overrides,
    }
  }

  it('creates a KPI with not_set status when no current value', async () => {
    const kpi = await repo.createKPI(makeKPI())
    expect(kpi.name).toBe('Monthly Revenue')
    expect(kpi.status).toBe('not_set')
    expect(kpi.target_value).toBe(100_000)
  })

  it('computes on_track status for higher_is_better KPI at target', async () => {
    const kpi = await repo.createKPI(makeKPI({ current_value: 100_000 }))
    expect(kpi.status).toBe('on_track')
  })

  it('computes at_risk status for higher_is_better KPI at 80%', async () => {
    const kpi = await repo.createKPI(makeKPI({ current_value: 80_000 }))
    expect(kpi.status).toBe('at_risk')
  })

  it('computes off_track status for higher_is_better KPI at 50%', async () => {
    const kpi = await repo.createKPI(makeKPI({ current_value: 50_000 }))
    expect(kpi.status).toBe('off_track')
  })

  it('computes on_track for lower_is_better at target', async () => {
    const kpi = await repo.createKPI(
      makeKPI({ direction: 'lower_is_better', target_value: 1000, current_value: 950 }),
    )
    expect(kpi.status).toBe('on_track')
  })

  it('computes off_track for lower_is_better when 2x target', async () => {
    const kpi = await repo.createKPI(
      makeKPI({ direction: 'lower_is_better', target_value: 1000, current_value: 2500 }),
    )
    expect(kpi.status).toBe('off_track')
  })

  it('updates previous_value when current_value changes', async () => {
    const kpi = await repo.createKPI(makeKPI({ current_value: 80_000 }))
    const updated = await repo.updateKPI(kpi.id, ORG_ID, { current_value: 95_000 })
    expect(updated.previous_value).toBe(80_000)
    expect(updated.current_value).toBe(95_000)
  })

  it('lists KPIs for a business', async () => {
    await repo.createKPI(makeKPI({ name: 'Revenue' }))
    await repo.createKPI(makeKPI({ name: 'Churn Rate', direction: 'lower_is_better', target_value: 5, unit: 'percentage' }))

    const kpis = await repo.listKPIs(businessId, ORG_ID)
    expect(kpis).toHaveLength(2)
  })

  it('deletes a KPI', async () => {
    const kpi = await repo.createKPI(makeKPI())
    await repo.deleteKPI(kpi.id, ORG_ID)

    const found = await repo.getKPI(kpi.id, ORG_ID)
    expect(found).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// RELATIONSHIPS
// ─────────────────────────────────────────────────────────────────────────────

describe('InMemoryBusinessRepository — relationships', () => {
  let repo: InMemoryBusinessRepository
  let biz: BusinessRecord

  beforeEach(async () => {
    repo = new InMemoryBusinessRepository()
    biz = await repo.create(makeBusinessData())
  })

  it('adds a relationship', async () => {
    const rel = await repo.addRelationship({
      business_id: biz.id,
      business_key: 'BIZ-TEST01',
      org_id: ORG_ID,
      entity_type: 'project',
      entity_key: 'PRJ-PROJ01',
      relationship_label: 'has project',
      created_by: USER_ID,
    })

    expect(rel.entity_type).toBe('project')
    expect(rel.entity_key).toBe('PRJ-PROJ01')
  })

  it('is idempotent when adding the same relationship twice', async () => {
    const data = {
      business_id: biz.id,
      business_key: 'BIZ-TEST01' as `BIZ-${string}`,
      org_id: ORG_ID,
      entity_type: 'project' as const,
      entity_key: 'PRJ-PROJ01',
      relationship_label: 'has project',
      created_by: USER_ID,
    }
    await repo.addRelationship(data)
    await repo.addRelationship(data)

    const list = await repo.listRelationships(biz.id, ORG_ID, 'project')
    expect(list).toHaveLength(1)
  })

  it('removes a relationship', async () => {
    await repo.addRelationship({
      business_id: biz.id,
      business_key: 'BIZ-TEST01',
      org_id: ORG_ID,
      entity_type: 'agent',
      entity_key: 'AGT-TEST01',
      relationship_label: 'uses agent',
      created_by: USER_ID,
    })

    await repo.removeRelationship(biz.id, 'agent', 'AGT-TEST01', ORG_ID)
    const list = await repo.listRelationships(biz.id, ORG_ID, 'agent')
    expect(list).toHaveLength(0)
  })

  it('lists relationships filtered by entity type', async () => {
    await repo.addRelationship({ business_id: biz.id, business_key: 'BIZ-TEST01', org_id: ORG_ID, entity_type: 'project', entity_key: 'PRJ-001', relationship_label: 'has project', created_by: USER_ID })
    await repo.addRelationship({ business_id: biz.id, business_key: 'BIZ-TEST01', org_id: ORG_ID, entity_type: 'agent', entity_key: 'AGT-001', relationship_label: 'uses agent', created_by: USER_ID })
    await repo.addRelationship({ business_id: biz.id, business_key: 'BIZ-TEST01', org_id: ORG_ID, entity_type: 'project', entity_key: 'PRJ-002', relationship_label: 'has project', created_by: USER_ID })

    const projects = await repo.listRelationships(biz.id, ORG_ID, 'project')
    expect(projects).toHaveLength(2)

    const agents = await repo.listRelationships(biz.id, ORG_ID, 'agent')
    expect(agents).toHaveLength(1)

    const all = await repo.listRelationships(biz.id, ORG_ID)
    expect(all).toHaveLength(3)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT LOG
// ─────────────────────────────────────────────────────────────────────────────

describe('InMemoryBusinessRepository — audit log', () => {
  let repo: InMemoryBusinessRepository

  beforeEach(() => {
    repo = new InMemoryBusinessRepository()
  })

  it('creates audit entries', async () => {
    const entry = await repo.createAuditEntry({
      org_id: ORG_ID,
      user_id: USER_ID,
      user_email: 'test@example.com',
      action: 'create',
      entity_type: 'business',
      entity_id: 'BIZ-TEST01',
      entity_title: 'Test Business',
      after_state: { name: 'Test Business' },
    })

    expect(entry.action).toBe('create')
    expect(entry.entity_type).toBe('business')
    expect(entry.user_id).toBe(USER_ID)
  })

  it('computes change diff when before and after states provided', async () => {
    const entry = await repo.createAuditEntry({
      org_id: ORG_ID,
      user_id: USER_ID,
      user_email: 'test@example.com',
      action: 'update',
      entity_type: 'business',
      entity_id: 'BIZ-TEST01',
      before_state: { name: 'Old Name', status: 'Pre-Launch' },
      after_state: { name: 'New Name', status: 'Active' },
    })

    expect(entry.change_diff).toBeDefined()
    expect(entry.change_diff?.['name']).toEqual({ before: 'Old Name', after: 'New Name' })
    expect(entry.change_diff?.['status']).toEqual({ before: 'Pre-Launch', after: 'Active' })
  })

  it('retrieves audit history with cursor pagination', async () => {
    for (let i = 0; i < 5; i++) {
      await repo.createAuditEntry({
        org_id: ORG_ID,
        user_id: USER_ID,
        user_email: 'test@example.com',
        action: 'update',
        entity_type: 'business',
        entity_id: 'BIZ-TEST01',
      })
    }

    const { entries: page1, nextCursor } = await repo.getAuditHistory(
      'business', 'BIZ-TEST01', ORG_ID, 3,
    )

    expect(page1).toHaveLength(3)
    expect(nextCursor).toBeTruthy()

    const { entries: page2 } = await repo.getAuditHistory(
      'business', 'BIZ-TEST01', ORG_ID, 3, nextCursor ?? undefined,
    )

    expect(page2).toHaveLength(2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY TIMELINE
// ─────────────────────────────────────────────────────────────────────────────

describe('InMemoryBusinessRepository — activity timeline', () => {
  let repo: InMemoryBusinessRepository

  beforeEach(() => {
    repo = new InMemoryBusinessRepository()
  })

  it('creates and retrieves activity events', async () => {
    await repo.createActivityEvent({
      org_id: ORG_ID,
      event_type: 'entity_created',
      actor_id: USER_ID,
      actor_name: 'Test User',
      entity_type: 'business',
      entity_id: 'BIZ-TEST01',
      entity_title: 'Test Business',
      description: 'Created business',
    })

    const { events } = await repo.getActivityTimeline('business', 'BIZ-TEST01', ORG_ID, 10)
    expect(events).toHaveLength(1)
    expect(events[0]?.event_type).toBe('entity_created')
  })

  it('returns events in reverse chronological order', async () => {
    for (let i = 0; i < 3; i++) {
      await repo.createActivityEvent({
        org_id: ORG_ID,
        event_type: 'entity_updated',
        actor_id: USER_ID,
        actor_name: 'Test User',
        entity_type: 'business',
        entity_id: 'BIZ-TEST01',
        entity_title: 'Test Business',
        description: `Update ${i}`,
      })
    }

    const { events } = await repo.getActivityTimeline('business', 'BIZ-TEST01', ORG_ID, 10)
    // Most recent first
    for (let i = 0; i < events.length - 1; i++) {
      expect(events[i]!.created_at >= events[i + 1]!.created_at).toBe(true)
    }
  })
})
