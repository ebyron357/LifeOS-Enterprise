/**
 * Business Repository Interface + In-Memory Implementation
 *
 * Defines the contract that all Business repository implementations must satisfy.
 * The InMemoryBusinessRepository is used for testing and provides a fast,
 * isolated, database-free implementation.
 *
 * Production code uses DrizzleBusinessRepository (packages/api/src/services/business/business.repository.postgres.ts)
 */
import { randomUUID } from 'node:crypto'
import type {
  ActivityEventRecord,
  AddRelationshipData,
  AuditLogRecord,
  BusinessQueryOptions,
  BusinessRecord,
  BusinessRelationshipRecord,
  BusinessSearchOptions,
  BusinessSearchResult,
  BusinessVersionRecord,
  CreateActivityEventData,
  CreateAuditEntryData,
  CreateKPIData,
  KPIRecord,
  PaginatedBusinessResult,
  UpdateKPIData,
} from './types.js'

// ─────────────────────────────────────────────────────────────────────────────
// REPOSITORY INTERFACE
// ─────────────────────────────────────────────────────────────────────────────

export interface IBusinessRepository {
  // Business CRUD
  findById(id: string, orgId: string): Promise<BusinessRecord | null>
  findByKey(businessKey: string, orgId: string): Promise<BusinessRecord | null>
  findMany(options: BusinessQueryOptions): Promise<PaginatedBusinessResult>
  create(data: Omit<BusinessRecord, 'id' | 'created_at' | 'updated_at' | 'version'>): Promise<BusinessRecord>
  update(id: string, orgId: string, data: Partial<BusinessRecord>): Promise<BusinessRecord>
  archive(id: string, orgId: string, archivedBy: string, reason?: string): Promise<BusinessRecord>
  restore(id: string, orgId: string, restoredBy: string): Promise<BusinessRecord>
  softDelete(id: string, orgId: string): Promise<void>
  search(options: BusinessSearchOptions): Promise<BusinessSearchResult>
  slugExists(slug: string, orgId: string, excludeId?: string): Promise<boolean>

  // Version history
  saveVersion(
    businessId: string,
    version: number,
    snapshot: BusinessRecord,
    changedBy: string,
    changeSummary?: string,
  ): Promise<BusinessVersionRecord>
  getVersionHistory(businessId: string, orgId: string, limit: number): Promise<BusinessVersionRecord[]>
  getVersionAt(businessId: string, version: number, orgId: string): Promise<BusinessVersionRecord | null>

  // KPIs
  createKPI(data: CreateKPIData): Promise<KPIRecord>
  updateKPI(id: string, orgId: string, data: UpdateKPIData): Promise<KPIRecord>
  deleteKPI(id: string, orgId: string): Promise<void>
  getKPI(id: string, orgId: string): Promise<KPIRecord | null>
  listKPIs(businessId: string, orgId: string): Promise<KPIRecord[]>

  // Relationships
  addRelationship(data: AddRelationshipData): Promise<BusinessRelationshipRecord>
  removeRelationship(
    businessId: string,
    entityType: string,
    entityKey: string,
    orgId: string,
  ): Promise<void>
  listRelationships(
    businessId: string,
    orgId: string,
    entityType?: string,
  ): Promise<BusinessRelationshipRecord[]>

  // Audit log
  createAuditEntry(data: CreateAuditEntryData): Promise<AuditLogRecord>
  getAuditHistory(
    entityType: string,
    entityId: string,
    orgId: string,
    limit: number,
    cursor?: string,
  ): Promise<{ entries: AuditLogRecord[]; nextCursor: string | null }>

  // Activity timeline
  createActivityEvent(data: CreateActivityEventData): Promise<ActivityEventRecord>
  getActivityTimeline(
    entityType: string,
    entityId: string,
    orgId: string,
    limit: number,
    cursor?: string,
  ): Promise<{ events: ActivityEventRecord[]; nextCursor: string | null }>
}

// ─────────────────────────────────────────────────────────────────────────────
// IN-MEMORY IMPLEMENTATION (for tests and development)
// ─────────────────────────────────────────────────────────────────────────────

function nowISO(): string {
  return new Date().toISOString()
}

function computeChangeDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Record<string, { before: unknown; after: unknown }> {
  const diff: Record<string, { before: unknown; after: unknown }> = {}
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)])

  for (const key of allKeys) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      diff[key] = { before: before[key], after: after[key] }
    }
  }

  return diff
}

export class InMemoryBusinessRepository implements IBusinessRepository {
  private businesses = new Map<string, BusinessRecord>()
  private versions = new Map<string, BusinessVersionRecord[]>()
  private kpis = new Map<string, KPIRecord>()
  private relationships = new Map<string, BusinessRelationshipRecord>()
  private auditEntries = new Map<string, AuditLogRecord>()
  private activityEvents = new Map<string, ActivityEventRecord>()

  // ─── Business CRUD ───────────────────────────────────────────────────────

  async findById(id: string, orgId: string): Promise<BusinessRecord | null> {
    const record = this.businesses.get(id)
    if (!record || record.org_id !== orgId || record.deleted_at !== undefined) return null
    return record
  }

  async findByKey(businessKey: string, orgId: string): Promise<BusinessRecord | null> {
    for (const record of this.businesses.values()) {
      if (record.business_key === businessKey && record.org_id === orgId && !record.deleted_at) {
        return record
      }
    }
    return null
  }

  async findMany(options: BusinessQueryOptions): Promise<PaginatedBusinessResult> {
    let items = Array.from(this.businesses.values()).filter(
      (b) =>
        b.org_id === options.org_id &&
        !b.deleted_at &&
        (options.filter?.archived !== undefined
          ? b.archived === options.filter.archived
          : !b.archived),
    )

    const f = options.filter
    if (f) {
      if (f.status?.length) items = items.filter((b) => f.status?.includes(b.status as never) ?? false)
      if (f.model?.length) items = items.filter((b) => b.model && f.model?.includes(b.model))
      if (f.industry) items = items.filter((b) => b.industry === f.industry)
      if (f.tags?.length)
        items = items.filter((b) => f.tags?.some((tag) => b.tags.includes(tag)) ?? false)
      if (f.owner) items = items.filter((b) => b.owner_id === f.owner)
      if (f.created_after)
        items = items.filter((b) => b.created_at >= (f.created_after ?? '') + 'T00:00:00Z')
      if (f.created_before)
        items = items.filter((b) => b.created_at <= (f.created_before ?? '') + 'T23:59:59Z')
    }

    // Sorting
    const sortFn = (a: BusinessRecord, b: BusinessRecord): number => {
      let aVal: string | number
      let bVal: string | number

      switch (options.sort_field) {
        case 'name':
          aVal = a.name.toLowerCase()
          bVal = b.name.toLowerCase()
          break
        case 'status':
          aVal = a.status
          bVal = b.status
          break
        case 'created':
          aVal = a.created_at
          bVal = b.created_at
          break
        case 'updated':
        default:
          aVal = a.updated_at
          bVal = b.updated_at
          break
      }

      const order = options.sort_order === 'asc' ? 1 : -1
      return aVal < bVal ? -order : aVal > bVal ? order : 0
    }

    items.sort(sortFn)

    const total = items.length
    const start = (options.page - 1) * options.per_page
    const paged = items.slice(start, start + options.per_page)

    return {
      items: paged,
      total,
      page: options.page,
      per_page: options.per_page,
      has_more: start + options.per_page < total,
    }
  }

  async create(
    data: Omit<BusinessRecord, 'id' | 'created_at' | 'updated_at' | 'version'>,
  ): Promise<BusinessRecord> {
    const id = randomUUID()
    const now = nowISO()
    const record: BusinessRecord = {
      ...data,
      id,
      version: 1,
      created_at: now,
      updated_at: now,
    }
    this.businesses.set(id, record)
    return record
  }

  async update(
    id: string,
    orgId: string,
    data: Partial<BusinessRecord>,
  ): Promise<BusinessRecord> {
    const record = await this.findById(id, orgId)
    if (!record) {
      throw new Error(`Business not found: ${id}`)
    }
    const updated: BusinessRecord = {
      ...record,
      ...data,
      id: record.id,
      org_id: record.org_id,
      updated_at: nowISO(),
      version: record.version + 1,
    }
    this.businesses.set(id, updated)
    return updated
  }

  async archive(
    id: string,
    orgId: string,
    archivedBy: string,
    reason?: string,
  ): Promise<BusinessRecord> {
    return this.update(id, orgId, {
      archived: true,
      archived_at: nowISO(),
      archived_by: archivedBy,
      archive_reason: reason,
    })
  }

  async restore(id: string, orgId: string, _restoredBy: string): Promise<BusinessRecord> {
    return this.update(id, orgId, {
      archived: false,
      archived_at: undefined,
      archived_by: undefined,
      archive_reason: undefined,
    })
  }

  async softDelete(id: string, orgId: string): Promise<void> {
    await this.update(id, orgId, { deleted_at: nowISO() })
  }

  async search(options: BusinessSearchOptions): Promise<BusinessSearchResult> {
    const q = options.query.toLowerCase()
    let items = Array.from(this.businesses.values()).filter(
      (b) =>
        b.org_id === options.org_id &&
        !b.deleted_at &&
        !b.archived &&
        (b.name.toLowerCase().includes(q) ||
          (b.description ?? '').toLowerCase().includes(q) ||
          (b.industry ?? '').toLowerCase().includes(q) ||
          b.tags.some((t) => t.includes(q))),
    )

    if (options.filter?.status?.length) {
      items = items.filter((b) => options.filter?.status?.includes(b.status as never) ?? false)
    }

    items = items.slice(0, options.limit)

    return { items, total: items.length, query: options.query }
  }

  async slugExists(slug: string, orgId: string, excludeId?: string): Promise<boolean> {
    for (const b of this.businesses.values()) {
      if (b.slug === slug && b.org_id === orgId && b.id !== excludeId && !b.deleted_at) {
        return true
      }
    }
    return false
  }

  // ─── Version history ──────────────────────────────────────────────────────

  async saveVersion(
    businessId: string,
    version: number,
    snapshot: BusinessRecord,
    changedBy: string,
    changeSummary?: string,
  ): Promise<BusinessVersionRecord> {
    const record: BusinessVersionRecord = {
      id: randomUUID(),
      business_id: businessId,
      business_key: snapshot.business_key,
      version,
      snapshot,
      changed_by: changedBy,
      change_summary: changeSummary,
      created_at: nowISO(),
    }

    const existing = this.versions.get(businessId) ?? []
    existing.push(record)
    this.versions.set(businessId, existing)

    return record
  }

  async getVersionHistory(
    businessId: string,
    _orgId: string,
    limit: number,
  ): Promise<BusinessVersionRecord[]> {
    const records = this.versions.get(businessId) ?? []
    return [...records].sort((a, b) => b.version - a.version).slice(0, limit)
  }

  async getVersionAt(
    businessId: string,
    version: number,
    _orgId: string,
  ): Promise<BusinessVersionRecord | null> {
    const records = this.versions.get(businessId) ?? []
    return records.find((r) => r.version === version) ?? null
  }

  // ─── KPIs ─────────────────────────────────────────────────────────────────

  async createKPI(data: CreateKPIData): Promise<KPIRecord> {
    const id = randomUUID()
    const now = nowISO()
    const status = this.computeKPIStatus(data)
    const record: KPIRecord = {
      id,
      ...data,
      status,
      previous_value: undefined,
      created_at: now,
      updated_at: now,
    }
    this.kpis.set(id, record)
    return record
  }

  async updateKPI(id: string, orgId: string, data: UpdateKPIData): Promise<KPIRecord> {
    const existing = await this.getKPI(id, orgId)
    if (!existing) throw new Error(`KPI not found: ${id}`)

    const updated: KPIRecord = {
      ...existing,
      ...data,
      id: existing.id,
      previous_value:
        data.current_value !== undefined ? existing.current_value : existing.previous_value,
      updated_at: nowISO(),
    }
    updated.status = this.computeKPIStatus(updated)
    this.kpis.set(id, updated)
    return updated
  }

  async deleteKPI(id: string, orgId: string): Promise<void> {
    const existing = await this.getKPI(id, orgId)
    if (!existing) throw new Error(`KPI not found: ${id}`)
    this.kpis.delete(id)
  }

  async getKPI(id: string, orgId: string): Promise<KPIRecord | null> {
    const record = this.kpis.get(id)
    if (!record || record.org_id !== orgId) return null
    return record
  }

  async listKPIs(businessId: string, orgId: string): Promise<KPIRecord[]> {
    return Array.from(this.kpis.values()).filter(
      (k) => k.business_id === businessId && k.org_id === orgId,
    )
  }

  private computeKPIStatus(
    kpi: Pick<KPIRecord, 'target_value' | 'current_value' | 'direction' | 'warning_threshold' | 'critical_threshold'>,
  ): KPIRecord['status'] {
    if (kpi.current_value === undefined) return 'not_set'

    const { target_value, current_value, direction, warning_threshold, critical_threshold } = kpi

    if (direction === 'higher_is_better') {
      if (critical_threshold !== undefined && current_value <= critical_threshold) return 'off_track'
      if (warning_threshold !== undefined && current_value <= warning_threshold) return 'at_risk'
      if (current_value >= target_value * 0.9) return 'on_track'
      if (current_value >= target_value * 0.75) return 'at_risk'
      return 'off_track'
    } else if (direction === 'lower_is_better') {
      if (critical_threshold !== undefined && current_value >= critical_threshold) return 'off_track'
      if (warning_threshold !== undefined && current_value >= warning_threshold) return 'at_risk'
      if (current_value <= target_value * 1.1) return 'on_track'
      if (current_value <= target_value * 1.25) return 'at_risk'
      return 'off_track'
    }

    // target_range: on_track if within ±10% of target
    const pct = Math.abs((current_value - target_value) / target_value)
    if (pct <= 0.1) return 'on_track'
    if (pct <= 0.25) return 'at_risk'
    return 'off_track'
  }

  // ─── Relationships ────────────────────────────────────────────────────────

  async addRelationship(data: AddRelationshipData): Promise<BusinessRelationshipRecord> {
    const key = `${data.business_id}:${data.entity_type}:${data.entity_key}`
    if (this.relationships.has(key)) {
      const existing = this.relationships.get(key)
      if (existing) return existing
    }

    const record: BusinessRelationshipRecord = {
      id: randomUUID(),
      ...data,
      metadata: data.metadata ?? {},
      created_at: nowISO(),
    }
    this.relationships.set(key, record)
    return record
  }

  async removeRelationship(
    businessId: string,
    entityType: string,
    entityKey: string,
    _orgId: string,
  ): Promise<void> {
    const key = `${businessId}:${entityType}:${entityKey}`
    this.relationships.delete(key)
  }

  async listRelationships(
    businessId: string,
    orgId: string,
    entityType?: string,
  ): Promise<BusinessRelationshipRecord[]> {
    return Array.from(this.relationships.values()).filter(
      (r) =>
        r.business_id === businessId &&
        r.org_id === orgId &&
        (entityType === undefined || r.entity_type === entityType),
    )
  }

  // ─── Audit log ────────────────────────────────────────────────────────────

  async createAuditEntry(data: CreateAuditEntryData): Promise<AuditLogRecord> {
    const id = randomUUID()
    const record: AuditLogRecord = {
      id,
      ...data,
      change_diff: data.before_state && data.after_state
        ? computeChangeDiff(data.before_state, data.after_state)
        : undefined,
      created_at: nowISO(),
    }
    this.auditEntries.set(id, record)
    return record
  }

  async getAuditHistory(
    entityType: string,
    entityId: string,
    orgId: string,
    limit: number,
    cursor?: string,
  ): Promise<{ entries: AuditLogRecord[]; nextCursor: string | null }> {
    let entries = Array.from(this.auditEntries.values())
      .filter(
        (e) => e.entity_type === entityType && e.entity_id === entityId && e.org_id === orgId,
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at))

    if (cursor) {
      const idx = entries.findIndex((e) => e.id === cursor)
      if (idx !== -1) entries = entries.slice(idx + 1)
    }

    const page = entries.slice(0, limit)
    const nextCursor = entries.length > limit ? page[page.length - 1]?.id ?? null : null

    return { entries: page, nextCursor }
  }

  // ─── Activity timeline ────────────────────────────────────────────────────

  async createActivityEvent(data: CreateActivityEventData): Promise<ActivityEventRecord> {
    const id = randomUUID()
    const record: ActivityEventRecord = {
      id,
      ...data,
      metadata: data.metadata ?? {},
      created_at: nowISO(),
    }
    this.activityEvents.set(id, record)
    return record
  }

  async getActivityTimeline(
    entityType: string,
    entityId: string,
    orgId: string,
    limit: number,
    cursor?: string,
  ): Promise<{ events: ActivityEventRecord[]; nextCursor: string | null }> {
    let events = Array.from(this.activityEvents.values())
      .filter(
        (e) => e.entity_type === entityType && e.entity_id === entityId && e.org_id === orgId,
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at))

    if (cursor) {
      const idx = events.findIndex((e) => e.id === cursor)
      if (idx !== -1) events = events.slice(idx + 1)
    }

    const page = events.slice(0, limit)
    const nextCursor = events.length > limit ? page[page.length - 1]?.id ?? null : null

    return { events: page, nextCursor }
  }

  // ─── Test helpers ─────────────────────────────────────────────────────────

  /** Reset all in-memory state. For use in test teardown only. */
  reset(): void {
    this.businesses.clear()
    this.versions.clear()
    this.kpis.clear()
    this.relationships.clear()
    this.auditEntries.clear()
    this.activityEvents.clear()
  }

  /** Snapshot current state for assertions. */
  snapshot() {
    return {
      businesses: [...this.businesses.values()],
      versions: [...this.versions.values()].flat(),
      kpis: [...this.kpis.values()],
      relationships: [...this.relationships.values()],
      auditEntries: [...this.auditEntries.values()],
      activityEvents: [...this.activityEvents.values()],
    }
  }
}
