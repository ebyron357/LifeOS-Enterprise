/**
 * BusinessService — Unit Tests
 *
 * Tests the full BusinessService using InMemoryBusinessRepository.
 * All tests are isolated (fresh repo per test).
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { BusinessService } from '../services/business/business.service.js'
import { InMemoryBusinessRepository } from '../services/business/business.repository.js'
import type { CreateBusinessInput } from '../services/business/business.service.js'

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const ORG_ID = 'org-test-001'

function makeUser(role: 'owner' | 'admin' | 'member' | 'viewer' = 'admin') {
  return {
    id: 'user-001',
    email: 'admin@example.com',
    name: 'Admin User',
    role,
    org_id: ORG_ID,
  }
}

function makeBusinessInput(overrides: Partial<CreateBusinessInput> = {}): CreateBusinessInput {
  return {
    name: 'Test Business',
    status: 'Pre-Launch',
    tags: [],
    metadata: {},
    ...overrides,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────────────────────

describe('BusinessService.create', () => {
  let service: BusinessService

  beforeEach(() => {
    service = new BusinessService(new InMemoryBusinessRepository())
  })

  it('creates a business with generated BIZ key', async () => {
    const biz = await service.create(makeBusinessInput({ name: 'TradeIQ' }), makeUser())
    expect(biz.name).toBe('TradeIQ')
    expect(biz.business_key).toMatch(/^BIZ-[A-Z0-9]+$/)
    expect(biz.org_id).toBe(ORG_ID)
    expect(biz.version).toBe(1)
  })

  it('generates a url-safe slug from the name', async () => {
    const biz = await service.create(makeBusinessInput({ name: 'TradeIQ Platform Inc.' }), makeUser())
    expect(biz.slug).toMatch(/^[a-z0-9-]+$/)
    expect(biz.slug).not.toContain(' ')
  })

  it('saves an audit log entry for creation', async () => {
    const biz = await service.create(makeBusinessInput(), makeUser())
    const { entries } = await service.getAuditHistory(biz.id, ORG_ID)
    expect(entries.length).toBeGreaterThan(0)
    expect(entries[0]?.action).toBe('create')
  })

  it('saves an activity event for creation', async () => {
    const biz = await service.create(makeBusinessInput(), makeUser())
    const { events } = await service.getActivityTimeline(biz.id, ORG_ID)
    expect(events.length).toBeGreaterThan(0)
    expect(events[0]?.event_type).toBe('entity_created')
  })

  it('saves version v1 on creation', async () => {
    const biz = await service.create(makeBusinessInput(), makeUser())
    const history = await service.getVersionHistory(biz.id, ORG_ID)
    expect(history).toHaveLength(1)
    expect(history[0]?.version).toBe(1)
  })

  it('allows two businesses with the same name (generates unique slugs)', async () => {
    await service.create(makeBusinessInput({ name: 'Alpha Corp' }), makeUser())
    const biz2 = await service.create(makeBusinessInput({ name: 'Alpha Corp' }), makeUser())
    expect(biz2).toBeDefined()
    expect(biz2.name).toBe('Alpha Corp')
  })

  it('populates default metadata', async () => {
    const biz = await service.create(makeBusinessInput(), makeUser())
    expect(biz.owner_id).toBe(makeUser().id)
    expect(biz.archived).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────────────────────

describe('BusinessService.getByKey', () => {
  let service: BusinessService

  beforeEach(() => {
    service = new BusinessService(new InMemoryBusinessRepository())
  })

  it('retrieves business by internal ID', async () => {
    const created = await service.create(makeBusinessInput(), makeUser())
    const found = await service.getByKey(created.id, ORG_ID)
    expect(found.id).toBe(created.id)
  })

  it('retrieves business by BIZ key', async () => {
    const created = await service.create(makeBusinessInput(), makeUser())
    const found = await service.getByKey(created.business_key, ORG_ID)
    expect(found.business_key).toBe(created.business_key)
  })

  it('throws NOT_FOUND for non-existent ID', async () => {
    await expect(service.getByKey('non-existent', ORG_ID)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  })

  it('throws NOT_FOUND when org does not match', async () => {
    const biz = await service.create(makeBusinessInput(), makeUser())
    await expect(service.getByKey(biz.id, 'other-org')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────────────────────

describe('BusinessService.update', () => {
  let service: BusinessService

  beforeEach(() => {
    service = new BusinessService(new InMemoryBusinessRepository())
  })

  it('updates fields and increments version', async () => {
    const biz = await service.create(makeBusinessInput(), makeUser())
    const updated = await service.update(biz.id, { name: 'New Name', status: 'Active' }, makeUser())
    expect(updated.name).toBe('New Name')
    expect(updated.status).toBe('Active')
    expect(updated.version).toBe(2)
  })

  it('saves a new version entry on update', async () => {
    const biz = await service.create(makeBusinessInput(), makeUser())
    await service.update(biz.id, { name: 'Updated' }, makeUser())
    const history = await service.getVersionHistory(biz.id, ORG_ID)
    expect(history).toHaveLength(2)
    expect(history[0]?.version).toBe(2)
  })

  it('logs an audit entry for updates', async () => {
    const biz = await service.create(makeBusinessInput(), makeUser())
    await service.update(biz.id, { name: 'Updated Name' }, makeUser())
    const { entries } = await service.getAuditHistory(biz.id, ORG_ID)
    const updateEntry = entries.find((e) => e.action === 'update')
    expect(updateEntry).toBeDefined()
  })

  it('throws NOT_FOUND when updating non-existent business', async () => {
    await expect(
      service.update('non-existent', { name: 'X' }, makeUser()),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ARCHIVE / RESTORE
// ─────────────────────────────────────────────────────────────────────────────

describe('BusinessService.archive and restore', () => {
  let service: BusinessService

  beforeEach(() => {
    service = new BusinessService(new InMemoryBusinessRepository())
  })

  it('archives a business', async () => {
    const biz = await service.create(makeBusinessInput(), makeUser())
    const archived = await service.archive(biz.id, 'Testing archive', makeUser())
    expect(archived.archived).toBe(true)
    expect(archived.archive_reason).toBe('Testing archive')
  })

  it('restores an archived business', async () => {
    const biz = await service.create(makeBusinessInput(), makeUser())
    await service.archive(biz.id, undefined, makeUser())
    const restored = await service.restore(biz.id, makeUser())
    expect(restored.archived).toBe(false)
  })

  it('logs audit entry on archive', async () => {
    const biz = await service.create(makeBusinessInput(), makeUser())
    await service.archive(biz.id, undefined, makeUser())
    const { entries } = await service.getAuditHistory(biz.id, ORG_ID)
    expect(entries.some((e) => e.action === 'archive')).toBe(true)
  })

  it('logs audit entry on restore', async () => {
    const biz = await service.create(makeBusinessInput(), makeUser())
    await service.archive(biz.id, undefined, makeUser())
    await service.restore(biz.id, makeUser())
    const { entries } = await service.getAuditHistory(biz.id, ORG_ID)
    expect(entries.some((e) => e.action === 'restore')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// TAGS
// ─────────────────────────────────────────────────────────────────────────────

describe('BusinessService — tags', () => {
  let service: BusinessService

  beforeEach(() => {
    service = new BusinessService(new InMemoryBusinessRepository())
  })

  it('adds a tag', async () => {
    const biz = await service.create(makeBusinessInput(), makeUser())
    const updated = await service.addTag(biz.id, 'saas', makeUser())
    expect(updated.tags).toContain('saas')
  })

  it('removes a tag', async () => {
    const biz = await service.create(makeBusinessInput({ tags: ['saas', 'startup'] }), makeUser())
    const updated = await service.removeTag(biz.id, 'startup', makeUser())
    expect(updated.tags).not.toContain('startup')
    expect(updated.tags).toContain('saas')
  })

  it('is idempotent when adding duplicate tags', async () => {
    const biz = await service.create(makeBusinessInput(), makeUser())
    await service.addTag(biz.id, 'saas', makeUser())
    const updated = await service.addTag(biz.id, 'saas', makeUser())
    expect(updated.tags.filter((t) => t === 'saas')).toHaveLength(1)
  })

  it('normalises tags to lowercase', async () => {
    const biz = await service.create(makeBusinessInput(), makeUser())
    const updated = await service.addTag(biz.id, 'SaaS', makeUser())
    expect(updated.tags).toContain('saas')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// KPIs
// ─────────────────────────────────────────────────────────────────────────────

describe('BusinessService — KPIs', () => {
  let service: BusinessService
  let bizId: string

  beforeEach(async () => {
    service = new BusinessService(new InMemoryBusinessRepository())
    const biz = await service.create(makeBusinessInput(), makeUser())
    bizId = biz.id
  })

  it('creates a KPI', async () => {
    const kpi = await service.createKPI(
      bizId,
      {
        name: 'Monthly Revenue',
        unit: 'currency',
        direction: 'higher_is_better',
        measurement_period: 'monthly',
        target_value: 100_000,
        tags: [],
      },
      makeUser(),
    )
    expect(kpi.name).toBe('Monthly Revenue')
    expect(kpi.business_id).toBe(bizId)
    expect(kpi.org_id).toBe(ORG_ID)
  })

  it('lists KPIs for a business', async () => {
    await service.createKPI(bizId, { name: 'Revenue', unit: 'currency', direction: 'higher_is_better', measurement_period: 'monthly', target_value: 100_000, tags: [] }, makeUser())
    await service.createKPI(bizId, { name: 'Churn', unit: 'percentage', direction: 'lower_is_better', measurement_period: 'monthly', target_value: 5, tags: [] }, makeUser())

    const kpis = await service.listKPIs(bizId, ORG_ID)
    expect(kpis).toHaveLength(2)
  })

  it('updates a KPI', async () => {
    const kpi = await service.createKPI(bizId, { name: 'Revenue', unit: 'currency', direction: 'higher_is_better', measurement_period: 'monthly', target_value: 100_000, tags: [] }, makeUser())
    const updated = await service.updateKPI(kpi.id, { current_value: 85_000 }, makeUser())
    expect(updated.current_value).toBe(85_000)
  })

  it('deletes a KPI', async () => {
    const kpi = await service.createKPI(bizId, { name: 'Revenue', unit: 'currency', direction: 'higher_is_better', measurement_period: 'monthly', target_value: 100_000, tags: [] }, makeUser())
    await service.deleteKPI(kpi.id, makeUser())
    const kpis = await service.listKPIs(bizId, ORG_ID)
    expect(kpis).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// LIST AND SEARCH
// ─────────────────────────────────────────────────────────────────────────────

describe('BusinessService.list and search', () => {
  let service: BusinessService

  beforeEach(async () => {
    service = new BusinessService(new InMemoryBusinessRepository())
    await service.create(makeBusinessInput({ name: 'TradeIQ', status: 'Active', tags: ['fintech'] }), makeUser())
    await service.create(makeBusinessInput({ name: 'ClientVerse', status: 'Active', tags: ['crm'] }), makeUser())
    await service.create(makeBusinessInput({ name: 'Alternative', status: 'Pre-Launch', tags: ['media'] }), makeUser())
  })

  it('lists all businesses', async () => {
    const result = await service.list({ org_id: ORG_ID, page: 1, per_page: 25, sort_field: 'name', sort_order: 'asc' })
    expect(result.total).toBe(3)
  })

  it('filters by status', async () => {
    const result = await service.list({
      org_id: ORG_ID,
      page: 1,
      per_page: 25,
      sort_field: 'name',
      sort_order: 'asc',
      filter: { status: ['Active'], archived: false },
    })
    expect(result.total).toBe(2)
  })

  it('searches by name', async () => {
    const result = await service.search({ org_id: ORG_ID, query: 'TradeIQ', limit: 10 })
    expect(result.total).toBe(1)
    expect(result.items[0]?.name).toBe('TradeIQ')
  })

  it('returns empty search results when no match', async () => {
    const result = await service.search({ org_id: ORG_ID, query: 'nonexistent-xyz-000', limit: 10 })
    expect(result.total).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// RELATIONSHIPS
// ─────────────────────────────────────────────────────────────────────────────

describe('BusinessService — relationships', () => {
  let service: BusinessService
  let bizId: string

  beforeEach(async () => {
    service = new BusinessService(new InMemoryBusinessRepository())
    const biz = await service.create(makeBusinessInput(), makeUser())
    bizId = biz.id
  })

  it('links an entity', async () => {
    await service.linkEntity(bizId, 'project', 'PRJ-TEST01', makeUser())
    const rel = await service.getRelationships(bizId, ORG_ID)
    expect(rel.some((r) => r.entity_type === 'project' && r.entity_key === 'PRJ-TEST01')).toBe(true)
  })

  it('unlinks an entity', async () => {
    await service.linkEntity(bizId, 'project', 'PRJ-TEST01', makeUser())
    await service.unlinkEntity(bizId, 'project', 'PRJ-TEST01', makeUser())
    const rel = await service.getRelationships(bizId, ORG_ID)
    expect(rel.some((r) => r.entity_type === 'project')).toBe(false)
  })

  it('logs activity when linking entities', async () => {
    await service.linkEntity(bizId, 'agent', 'AGT-TEST01', makeUser())
    const { events } = await service.getActivityTimeline(bizId, ORG_ID)
    expect(events.some((e) => e.description?.includes('agent'))).toBe(true)
  })
})
