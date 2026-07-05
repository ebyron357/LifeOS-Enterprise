import {
  activityTimeline,
  auditLog,
  businessRelationships,
  businesses,
  businessVersions,
  getDatabase,
  kpis,
  type LifeOSDatabase,
} from '@lifeos/db'
import { and, asc, count, desc, eq, gte, ilike, inArray, isNull, lte, ne, or, sql } from 'drizzle-orm'
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
import type { IBusinessRepository } from './business.repository.js'

type DatabaseLike = LifeOSDatabase

function toISO(value: Date | string | null | undefined): string | undefined {
  if (value === null || value === undefined) return undefined
  return value instanceof Date ? value.toISOString() : value
}

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
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

export class DrizzleBusinessRepository implements IBusinessRepository {
  constructor(private readonly db: DatabaseLike = getDatabase()) {}

  async withTransaction<T>(fn: (repo: DrizzleBusinessRepository) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => fn(new DrizzleBusinessRepository(tx as DatabaseLike)))
  }

  private mapBusiness(row: typeof businesses.$inferSelect): BusinessRecord {
    return {
      ...row,
      status: row.status as BusinessRecord['status'],
      metadata: (row.metadata ?? {}) as Record<string, unknown>,
      created_at: toISO(row.created_at) ?? new Date(0).toISOString(),
      updated_at: toISO(row.updated_at) ?? new Date(0).toISOString(),
      archived_at: toISO(row.archived_at),
      deleted_at: toISO(row.deleted_at),
      founded: row.founded ?? undefined,
      model: row.model ?? undefined,
      industry: row.industry ?? undefined,
      website: row.website ?? undefined,
      github_org: row.github_org ?? undefined,
      description: row.description ?? undefined,
      ai_owner_id: row.ai_owner_id ?? undefined,
      archived_by: row.archived_by ?? undefined,
      archive_reason: row.archive_reason ?? undefined,
    }
  }

  private mapKPI(row: typeof kpis.$inferSelect): KPIRecord {
    return {
      ...row,
      direction: row.direction as KPIRecord['direction'],
      measurement_period: row.measurement_period as KPIRecord['measurement_period'],
      status: row.status as KPIRecord['status'],
      target_value: toNumber(row.target_value) ?? 0,
      current_value: toNumber(row.current_value),
      previous_value: toNumber(row.previous_value),
      warning_threshold: toNumber(row.warning_threshold),
      critical_threshold: toNumber(row.critical_threshold),
      description: row.description ?? undefined,
      created_at: toISO(row.created_at) ?? new Date(0).toISOString(),
      updated_at: toISO(row.updated_at) ?? new Date(0).toISOString(),
    }
  }

  private mapRelationship(row: typeof businessRelationships.$inferSelect): BusinessRelationshipRecord {
    return {
      ...row,
      metadata: (row.metadata ?? {}) as Record<string, unknown>,
      created_at: toISO(row.created_at) ?? new Date(0).toISOString(),
    }
  }

  private mapVersion(row: typeof businessVersions.$inferSelect): BusinessVersionRecord {
    const snapshot = row.snapshot as BusinessRecord
    return {
      id: row.id,
      business_id: row.business_id,
      business_key: snapshot.business_key,
      version: row.version,
      snapshot,
      changed_by: row.changed_by,
      change_summary: row.change_summary ?? undefined,
      created_at: toISO(row.created_at) ?? new Date(0).toISOString(),
    }
  }

  private mapAudit(row: typeof auditLog.$inferSelect): AuditLogRecord {
    return {
      ...row,
      before_state: (row.before_state ?? undefined) as Record<string, unknown> | undefined,
      after_state: (row.after_state ?? undefined) as Record<string, unknown> | undefined,
      change_diff: (row.change_diff ?? undefined) as Record<string, unknown> | undefined,
      entity_title: row.entity_title ?? undefined,
      ip_address: row.ip_address ?? undefined,
      user_agent: row.user_agent ?? undefined,
      request_id: row.request_id ?? undefined,
      created_at: toISO(row.created_at) ?? new Date(0).toISOString(),
    }
  }

  private mapActivity(row: typeof activityTimeline.$inferSelect): ActivityEventRecord {
    return {
      ...row,
      actor_avatar: row.actor_avatar ?? undefined,
      metadata: (row.metadata ?? {}) as Record<string, unknown>,
      created_at: toISO(row.created_at) ?? new Date(0).toISOString(),
    }
  }

  async findById(id: string, orgId: string): Promise<BusinessRecord | null> {
    const row = await this.db.query.businesses.findFirst({
      where: and(eq(businesses.id, id), eq(businesses.org_id, orgId), isNull(businesses.deleted_at)),
    })
    return row ? this.mapBusiness(row) : null
  }

  async findByKey(businessKey: string, orgId: string): Promise<BusinessRecord | null> {
    const row = await this.db.query.businesses.findFirst({
      where: and(
        eq(businesses.business_key, businessKey),
        eq(businesses.org_id, orgId),
        isNull(businesses.deleted_at),
      ),
    })
    return row ? this.mapBusiness(row) : null
  }

  async findMany(options: BusinessQueryOptions): Promise<PaginatedBusinessResult> {
    const filters = [
      eq(businesses.org_id, options.org_id),
      isNull(businesses.deleted_at),
      options.filter?.archived !== undefined
        ? eq(businesses.archived, options.filter.archived)
        : eq(businesses.archived, false),
      options.filter?.status?.length ? inArray(businesses.status, options.filter.status) : undefined,
      options.filter?.model?.length ? inArray(businesses.model, options.filter.model) : undefined,
      options.filter?.industry ? eq(businesses.industry, options.filter.industry) : undefined,
      options.filter?.owner ? eq(businesses.owner_id, options.filter.owner) : undefined,
      options.filter?.created_after
        ? gte(businesses.created_at, new Date(`${options.filter.created_after}T00:00:00.000Z`))
        : undefined,
      options.filter?.created_before
        ? lte(businesses.created_at, new Date(`${options.filter.created_before}T23:59:59.999Z`))
        : undefined,
      options.filter?.tags?.length
        ? sql<boolean>`${businesses.tags} && ${options.filter.tags}`
        : undefined,
    ].filter(Boolean)

    const where = and(...filters)

    const orderBy =
      options.sort_field === 'name'
        ? options.sort_order === 'asc'
          ? asc(businesses.name)
          : desc(businesses.name)
        : options.sort_field === 'status'
          ? options.sort_order === 'asc'
            ? asc(businesses.status)
            : desc(businesses.status)
          : options.sort_field === 'created'
            ? options.sort_order === 'asc'
              ? asc(businesses.created_at)
              : desc(businesses.created_at)
            : options.sort_order === 'asc'
              ? asc(businesses.updated_at)
              : desc(businesses.updated_at)

    const [rows, totalRows] = await Promise.all([
      this.db
        .select()
        .from(businesses)
        .where(where)
        .orderBy(orderBy)
        .limit(options.per_page)
        .offset((options.page - 1) * options.per_page),
      this.db.select({ total: count() }).from(businesses).where(where),
    ])

    const total = totalRows[0]?.total ?? 0

    return {
      items: rows.map((row) => this.mapBusiness(row)),
      total,
      page: options.page,
      per_page: options.per_page,
      has_more: options.page * options.per_page < total,
    }
  }

  async create(
    data: Omit<BusinessRecord, 'id' | 'created_at' | 'updated_at' | 'version'>,
  ): Promise<BusinessRecord> {
    const [row] = await this.db
      .insert(businesses)
      .values({
        ...data,
        metadata: data.metadata ?? {},
        tags: data.tags ?? [],
      })
      .returning()

    if (!row) {
      throw new Error('Failed to create business')
    }

    return this.mapBusiness(row)
  }

  async update(id: string, orgId: string, data: Partial<BusinessRecord>): Promise<BusinessRecord> {
    const existing = await this.findById(id, orgId)
    if (!existing) {
      throw new Error(`Business not found: ${id}`)
    }

    const [row] = await this.db
      .update(businesses)
      .set({
        ...data,
        org_id: existing.org_id,
        id: existing.id,
        version: existing.version + 1,
        updated_at: new Date(),
      })
      .where(and(eq(businesses.id, id), eq(businesses.org_id, orgId), isNull(businesses.deleted_at)))
      .returning()

    if (!row) {
      throw new Error(`Business not found: ${id}`)
    }

    return this.mapBusiness(row)
  }

  async archive(
    id: string,
    orgId: string,
    archivedBy: string,
    reason?: string,
  ): Promise<BusinessRecord> {
    return this.update(id, orgId, {
      archived: true,
      archived_at: new Date().toISOString(),
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
    await this.update(id, orgId, { deleted_at: new Date().toISOString() })
  }

  async search(options: BusinessSearchOptions): Promise<BusinessSearchResult> {
    const q = `%${options.query.trim().toLowerCase()}%`
    const filterStatus = options.filter?.status?.length
      ? inArray(businesses.status, options.filter.status)
      : undefined

    const rows = await this.db
      .select()
      .from(businesses)
      .where(
        and(
          eq(businesses.org_id, options.org_id),
          isNull(businesses.deleted_at),
          eq(businesses.archived, false),
          filterStatus,
          or(
            ilike(sql`lower(${businesses.name})`, q),
            ilike(sql`lower(coalesce(${businesses.description}, ''))`, q),
            ilike(sql`lower(coalesce(${businesses.industry}, ''))`, q),
            sql<boolean>`exists (
              select 1
              from unnest(${businesses.tags}) as tag
              where lower(tag) like ${q}
            )`,
          ),
        ),
      )
      .orderBy(desc(businesses.updated_at))
      .limit(options.limit)

    const items = rows.map((row) => this.mapBusiness(row))
    return { items, total: items.length, query: options.query }
  }

  async slugExists(slug: string, orgId: string, excludeId?: string): Promise<boolean> {
    const row = await this.db
      .select({ total: count() })
      .from(businesses)
      .where(
        and(
          eq(businesses.slug, slug),
          eq(businesses.org_id, orgId),
          isNull(businesses.deleted_at),
          excludeId ? ne(businesses.id, excludeId) : undefined,
        ),
      )

    return (row[0]?.total ?? 0) > 0
  }

  async saveVersion(
    businessId: string,
    version: number,
    snapshot: BusinessRecord,
    changedBy: string,
    changeSummary?: string,
  ): Promise<BusinessVersionRecord> {
    const [row] = await this.db
      .insert(businessVersions)
      .values({
        business_id: businessId,
        version,
        snapshot,
        changed_by: changedBy,
        change_summary: changeSummary,
      })
      .returning()

    if (!row) {
      throw new Error('Failed to save business version')
    }

    return this.mapVersion(row)
  }

  async getVersionHistory(
    businessId: string,
    _orgId: string,
    limit: number,
  ): Promise<BusinessVersionRecord[]> {
    const rows = await this.db
      .select()
      .from(businessVersions)
      .where(eq(businessVersions.business_id, businessId))
      .orderBy(desc(businessVersions.version))
      .limit(limit)

    return rows.map((row) => this.mapVersion(row))
  }

  async getVersionAt(
    businessId: string,
    version: number,
    _orgId: string,
  ): Promise<BusinessVersionRecord | null> {
    const row = await this.db.query.businessVersions.findFirst({
      where: and(eq(businessVersions.business_id, businessId), eq(businessVersions.version, version)),
    })

    return row ? this.mapVersion(row) : null
  }

  private computeKPIStatus(
    kpi: Pick<
      KPIRecord,
      'target_value' | 'current_value' | 'direction' | 'warning_threshold' | 'critical_threshold'
    >,
  ): KPIRecord['status'] {
    if (kpi.current_value === undefined) return 'not_set'

    const { target_value, current_value, direction, warning_threshold, critical_threshold } = kpi

    if (direction === 'higher_is_better') {
      if (critical_threshold !== undefined && current_value <= critical_threshold) return 'off_track'
      if (warning_threshold !== undefined && current_value <= warning_threshold) return 'at_risk'
      if (current_value >= target_value * 0.9) return 'on_track'
      if (current_value >= target_value * 0.75) return 'at_risk'
      return 'off_track'
    }

    if (direction === 'lower_is_better') {
      if (critical_threshold !== undefined && current_value >= critical_threshold) return 'off_track'
      if (warning_threshold !== undefined && current_value >= warning_threshold) return 'at_risk'
      if (current_value <= target_value * 1.1) return 'on_track'
      if (current_value <= target_value * 1.25) return 'at_risk'
      return 'off_track'
    }

    const pct = Math.abs((current_value - target_value) / target_value)
    if (pct <= 0.1) return 'on_track'
    if (pct <= 0.25) return 'at_risk'
    return 'off_track'
  }

  async createKPI(data: CreateKPIData): Promise<KPIRecord> {
    const status = this.computeKPIStatus({
      target_value: data.target_value,
      current_value: data.current_value,
      direction: data.direction,
      warning_threshold: data.warning_threshold,
      critical_threshold: data.critical_threshold,
    })

    const [row] = await this.db
      .insert(kpis)
      .values({
        ...data,
        status,
      })
      .returning()

    if (!row) {
      throw new Error('Failed to create KPI')
    }

    return this.mapKPI(row)
  }

  async updateKPI(id: string, orgId: string, data: UpdateKPIData): Promise<KPIRecord> {
    const existing = await this.getKPI(id, orgId)
    if (!existing) throw new Error(`KPI not found: ${id}`)

    const nextCurrent = data.current_value ?? existing.current_value
    const updatedStatus = this.computeKPIStatus({
      target_value: data.target_value ?? existing.target_value,
      current_value: nextCurrent,
      direction: data.direction ?? existing.direction,
      warning_threshold: data.warning_threshold ?? existing.warning_threshold,
      critical_threshold: data.critical_threshold ?? existing.critical_threshold,
    })

    const [row] = await this.db
      .update(kpis)
      .set({
        ...data,
        previous_value: data.current_value !== undefined ? existing.current_value : existing.previous_value,
        status: updatedStatus,
        updated_at: new Date(),
      })
      .where(and(eq(kpis.id, id), eq(kpis.org_id, orgId)))
      .returning()

    if (!row) throw new Error(`KPI not found: ${id}`)

    return this.mapKPI(row)
  }

  async deleteKPI(id: string, orgId: string): Promise<void> {
    const existing = await this.getKPI(id, orgId)
    if (!existing) throw new Error(`KPI not found: ${id}`)

    await this.db.delete(kpis).where(and(eq(kpis.id, id), eq(kpis.org_id, orgId)))
  }

  async getKPI(id: string, orgId: string): Promise<KPIRecord | null> {
    const row = await this.db.query.kpis.findFirst({
      where: and(eq(kpis.id, id), eq(kpis.org_id, orgId)),
    })
    return row ? this.mapKPI(row) : null
  }

  async listKPIs(businessId: string, orgId: string): Promise<KPIRecord[]> {
    const rows = await this.db
      .select()
      .from(kpis)
      .where(and(eq(kpis.business_id, businessId), eq(kpis.org_id, orgId)))
      .orderBy(desc(kpis.updated_at))

    return rows.map((row) => this.mapKPI(row))
  }

  async addRelationship(data: AddRelationshipData): Promise<BusinessRelationshipRecord> {
    const existing = await this.db.query.businessRelationships.findFirst({
      where: and(
        eq(businessRelationships.business_id, data.business_id),
        eq(businessRelationships.entity_type, data.entity_type),
        eq(businessRelationships.entity_key, data.entity_key),
      ),
    })
    if (existing) return this.mapRelationship(existing)

    const [row] = await this.db.insert(businessRelationships).values(data).returning()
    if (!row) {
      throw new Error('Failed to add relationship')
    }
    return this.mapRelationship(row)
  }

  async removeRelationship(
    businessId: string,
    entityType: string,
    entityKey: string,
    orgId: string,
  ): Promise<void> {
    await this.db
      .delete(businessRelationships)
      .where(
        and(
          eq(businessRelationships.business_id, businessId),
          eq(businessRelationships.entity_type, entityType),
          eq(businessRelationships.entity_key, entityKey),
          eq(businessRelationships.org_id, orgId),
        ),
      )
  }

  async listRelationships(
    businessId: string,
    orgId: string,
    entityType?: string,
  ): Promise<BusinessRelationshipRecord[]> {
    const rows = await this.db
      .select()
      .from(businessRelationships)
      .where(
        and(
          eq(businessRelationships.business_id, businessId),
          eq(businessRelationships.org_id, orgId),
          entityType ? eq(businessRelationships.entity_type, entityType) : undefined,
        ),
      )
      .orderBy(desc(businessRelationships.created_at))

    return rows.map((row) => this.mapRelationship(row))
  }

  async createAuditEntry(data: CreateAuditEntryData): Promise<AuditLogRecord> {
    const [row] = await this.db
      .insert(auditLog)
      .values({
        ...data,
        change_diff:
          data.before_state && data.after_state
            ? computeChangeDiff(data.before_state, data.after_state)
            : undefined,
      })
      .returning()

    if (!row) {
      throw new Error('Failed to create audit entry')
    }

    return this.mapAudit(row)
  }

  async getAuditHistory(
    entityType: string,
    entityId: string,
    orgId: string,
    limit: number,
    cursor?: string,
  ): Promise<{ entries: AuditLogRecord[]; nextCursor: string | null }> {
    const rows = await this.db
      .select()
      .from(auditLog)
      .where(and(eq(auditLog.entity_type, entityType), eq(auditLog.entity_id, entityId), eq(auditLog.org_id, orgId)))
      .orderBy(desc(auditLog.created_at), desc(auditLog.id))

    let entries = rows
    if (cursor) {
      const idx = entries.findIndex((entry) => entry.id === cursor)
      if (idx !== -1) entries = entries.slice(idx + 1)
    }

    const page = entries.slice(0, limit).map((row) => this.mapAudit(row))
    const nextCursor = entries.length > limit ? page[page.length - 1]?.id ?? null : null
    return { entries: page, nextCursor }
  }

  async createActivityEvent(data: CreateActivityEventData): Promise<ActivityEventRecord> {
    const [row] = await this.db.insert(activityTimeline).values(data).returning()
    if (!row) {
      throw new Error('Failed to create activity event')
    }
    return this.mapActivity(row)
  }

  async getActivityTimeline(
    entityType: string,
    entityId: string,
    orgId: string,
    limit: number,
    cursor?: string,
  ): Promise<{ events: ActivityEventRecord[]; nextCursor: string | null }> {
    const rows = await this.db
      .select()
      .from(activityTimeline)
      .where(
        and(
          eq(activityTimeline.entity_type, entityType),
          eq(activityTimeline.entity_id, entityId),
          eq(activityTimeline.org_id, orgId),
        ),
      )
      .orderBy(desc(activityTimeline.created_at), desc(activityTimeline.id))

    let events = rows
    if (cursor) {
      const idx = events.findIndex((entry) => entry.id === cursor)
      if (idx !== -1) events = events.slice(idx + 1)
    }

    const page = events.slice(0, limit).map((row) => this.mapActivity(row))
    const nextCursor = events.length > limit ? page[page.length - 1]?.id ?? null : null
    return { events: page, nextCursor }
  }
}
