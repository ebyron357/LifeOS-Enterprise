/**
 * Business tRPC Router — Tests
 *
 * Tests authorization rules and endpoint correctness using tRPC caller API.
 * Uses InMemoryBusinessRepository; no real database required.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { appRouter } from '../routers/index.js'
import { createAuthenticatedTestContext } from '../trpc.js'
import { resetBusinessService } from '../routers/business.router.js'

// ─────────────────────────────────────────────────────────────────────────────
// SETUP
// ─────────────────────────────────────────────────────────────────────────────

const ORG_ID = 'org-router-test'

function makeCaller(role: 'owner' | 'admin' | 'member' | 'viewer') {
  const ctx = createAuthenticatedTestContext({
    id: `user-${role}`,
    email: `${role}@example.com`,
    name: `Test ${role}`,
    role,
    org_id: ORG_ID,
  })
  return appRouter.createCaller(ctx)
}

// Reset the singleton business service between tests so we get a clean state
beforeEach(() => {
  resetBusinessService()
})

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────

describe('business.create — authorization', () => {
  it('allows member to create a business', async () => {
    const caller = makeCaller('member')
    const biz = await caller.business.create({
      name: 'Test Corp',
      status: 'Pre-Launch',
      tags: [],
      metadata: {},
    })
    expect(biz.name).toBe('Test Corp')
  })

  it('allows admin to create a business', async () => {
    const caller = makeCaller('admin')
    const biz = await caller.business.create({
      name: 'Admin Corp',
      status: 'Pre-Launch',
      tags: [],
      metadata: {},
    })
    expect(biz.name).toBe('Admin Corp')
  })

  it('denies viewer from creating a business', async () => {
    const caller = makeCaller('viewer')
    await expect(
      caller.business.create({ name: 'Viewer Corp', status: 'Pre-Launch', tags: [], metadata: {} }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })
})

describe('business.archive — authorization', () => {
  it('allows admin to archive', async () => {
    const adminCaller = makeCaller('admin')
    const biz = await adminCaller.business.create({ name: 'Corp to Archive', status: 'Active', tags: [], metadata: {} })
    const archived = await adminCaller.business.archive({ id: biz.id })
    expect(archived.archived).toBe(true)
  })

  it('denies member from archiving', async () => {
    const adminCaller = makeCaller('admin')
    const memberCaller = makeCaller('member')
    const biz = await adminCaller.business.create({ name: 'Protected Corp', status: 'Active', tags: [], metadata: {} })
    await expect(memberCaller.business.archive({ id: biz.id })).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// CRUD ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

describe('business router — CRUD', () => {
  let adminCaller: ReturnType<typeof makeCaller>
  let viewerCaller: ReturnType<typeof makeCaller>

  beforeEach(() => {
    adminCaller = makeCaller('admin')
    viewerCaller = makeCaller('viewer')
  })

  it('creates and retrieves a business', async () => {
    const created = await adminCaller.business.create({ name: 'Retrieve Test Corp', status: 'Active', tags: [], metadata: {} })
    const found = await viewerCaller.business.get({ id: created.id })
    expect(found.id).toBe(created.id)
    expect(found.name).toBe('Retrieve Test Corp')
  })

  it('lists businesses', async () => {
    await adminCaller.business.create({ name: 'List Corp A', status: 'Active', tags: [], metadata: {} })
    await adminCaller.business.create({ name: 'List Corp B', status: 'Active', tags: [], metadata: {} })

    const result = await viewerCaller.business.list({
      page: 1,
      per_page: 25,
      sort_field: 'name',
      sort_order: 'asc',
    })
    expect(result.total).toBeGreaterThanOrEqual(2)
  })

  it('updates a business', async () => {
    const created = await adminCaller.business.create({ name: 'Update Corp', status: 'Pre-Launch', tags: [], metadata: {} })
    const updated = await adminCaller.business.update({ id: created.id, data: { name: 'Updated Corp', status: 'Active' } })
    expect(updated.name).toBe('Updated Corp')
    expect(updated.version).toBe(2)
  })

  it('searches businesses', async () => {
    await adminCaller.business.create({ name: 'SearchableWidget Co', status: 'Active', tags: [], metadata: {} })
    const result = await viewerCaller.business.search({ query: 'SearchableWidget', limit: 10 })
    expect(result.total).toBeGreaterThanOrEqual(1)
  })

  it('archives and restores a business', async () => {
    const biz = await adminCaller.business.create({ name: 'Archive Me Corp', status: 'Active', tags: [], metadata: {} })
    const archived = await adminCaller.business.archive({ id: biz.id })
    expect(archived.archived).toBe(true)

    const restored = await adminCaller.business.restore({ id: biz.id })
    expect(restored.archived).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// KPI ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

describe('business router — KPIs', () => {
  let adminCaller: ReturnType<typeof makeCaller>
  let viewerCaller: ReturnType<typeof makeCaller>
  let bizId: string

  beforeEach(async () => {
    adminCaller = makeCaller('admin')
    viewerCaller = makeCaller('viewer')
    const biz = await adminCaller.business.create({ name: 'KPI Test Corp', status: 'Active', tags: [], metadata: {} })
    bizId = biz.id
  })

  it('creates and lists KPIs', async () => {
    await adminCaller.business.createKPI({
      id: bizId,
      data: { name: 'Revenue', unit: 'currency', direction: 'higher_is_better', measurement_period: 'monthly', target_value: 100_000, tags: [] },
    })
    const kpis = await viewerCaller.business.listKPIs({ id: bizId })
    expect(kpis).toHaveLength(1)
    expect(kpis[0]?.name).toBe('Revenue')
  })

  it('updates a KPI', async () => {
    const kpi = await adminCaller.business.createKPI({
      id: bizId,
      data: { name: 'Revenue', unit: 'currency', direction: 'higher_is_better', measurement_period: 'monthly', target_value: 100_000, tags: [] },
    })
    const updated = await adminCaller.business.updateKPI({ id: bizId, kpi_id: kpi.id, data: { current_value: 75_000 } })
    expect(updated.current_value).toBe(75_000)
  })

  it('deletes a KPI (admin only)', async () => {
    const memberCaller = makeCaller('member')
    const kpi = await adminCaller.business.createKPI({
      id: bizId,
      data: { name: 'Temp KPI', unit: 'count', direction: 'higher_is_better', measurement_period: 'monthly', target_value: 100, tags: [] },
    })

    await expect(
      memberCaller.business.deleteKPI({ id: bizId, kpi_id: kpi.id }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })

    await adminCaller.business.deleteKPI({ id: bizId, kpi_id: kpi.id })
    const kpis = await viewerCaller.business.listKPIs({ id: bizId })
    expect(kpis).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// RELATIONSHIP ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

describe('business router — relationships', () => {
  let adminCaller: ReturnType<typeof makeCaller>
  let viewerCaller: ReturnType<typeof makeCaller>
  let bizId: string

  beforeEach(async () => {
    adminCaller = makeCaller('admin')
    viewerCaller = makeCaller('viewer')
    const biz = await adminCaller.business.create({ name: 'Rel Test Corp', status: 'Active', tags: [], metadata: {} })
    bizId = biz.id
  })

  it('links and retrieves relationships', async () => {
    await adminCaller.business.linkEntity({ id: bizId, entity_type: 'project', entity_key: 'PRJ-TEST01' })
    const rels = await viewerCaller.business.getRelationships({ id: bizId })
    expect(rels.some((r) => r.entity_type === 'project')).toBe(true)
  })

  it('unlinks a relationship', async () => {
    await adminCaller.business.linkEntity({ id: bizId, entity_type: 'agent', entity_key: 'AGT-TEST01' })
    await adminCaller.business.unlinkEntity({ id: bizId, entity_type: 'agent', entity_key: 'AGT-TEST01' })
    const rels = await viewerCaller.business.getRelationships({ id: bizId })
    expect(rels.some((r) => r.entity_type === 'agent')).toBe(false)
  })

  it('denies viewer from linking entities', async () => {
    await expect(
      viewerCaller.business.linkEntity({ id: bizId, entity_type: 'project', entity_key: 'PRJ-001' }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY AND AUDIT ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

describe('business router — activity and audit', () => {
  let adminCaller: ReturnType<typeof makeCaller>
  let viewerCaller: ReturnType<typeof makeCaller>
  let bizId: string

  beforeEach(async () => {
    adminCaller = makeCaller('admin')
    viewerCaller = makeCaller('viewer')
    const biz = await adminCaller.business.create({ name: 'Activity Corp', status: 'Active', tags: [], metadata: {} })
    bizId = biz.id
    await adminCaller.business.update({ id: bizId, data: { name: 'Activity Corp Updated' } })
  })

  it('retrieves activity timeline', async () => {
    const result = await viewerCaller.business.getActivity({ id: bizId, limit: 20 })
    expect(result.events.length).toBeGreaterThan(0)
  })

  it('retrieves audit history (admin required)', async () => {
    const result = await adminCaller.business.getAuditHistory({ id: bizId, limit: 20 })
    expect(result.entries.length).toBeGreaterThan(0)
  })

  it('denies viewer from accessing audit history', async () => {
    await expect(
      viewerCaller.business.getAuditHistory({ id: bizId, limit: 20 }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('retrieves version history', async () => {
    const versions = await viewerCaller.business.getVersionHistory({ id: bizId, limit: 10 })
    expect(versions.length).toBeGreaterThanOrEqual(2) // create + update
  })
})
