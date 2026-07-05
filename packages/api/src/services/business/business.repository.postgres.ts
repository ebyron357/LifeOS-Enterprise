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

type BusinessInsert = typeof businesses.$inferInsert
type KPIInsert = typeof kpis.$inferInsert

function toISO(value: Date | string | null | undefined): string | undefined {
  if (value === null || value === undefined) return undefined
  return value instanceof Date ? value.toISOString() : value
}

function toDate(value: string | undefined): Date | null | undefined {
  if (value === undefined) return undefined
  if (value === '') return null
  return new Date(value)
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

function numToDb(value: number | undefined): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  return value.toString()
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
    return this.db.transaction(async (tx) => fn(new DrizzleBusinessRepository(tx as unknown as DatabaseLike)))
  }

  private mapBusiness(row: typeof businesses.$inferSelect): BusinessRecord {
    return {
      ...row,
      business_key: row.business_key as `BIZ-${string}`,
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
      business_key: row.business_key as `BIZ-${string}`,
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
      business_key: row.business_key as `BIZ-${string}`,
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
    const rows = await this.db
      .select()
      .from(businesses)
      .where(and(eq(businesses.id, id), eq(businesses.org_id, orgId), isNull(businesses.deleted_at)))
      .limit(1)

    const row = rows[0]
    return row ? this.mapBusiness(row) : null
  }

  async findByKey(businessKey: string, orgId: string): Promise<BusinessRecord | null> {
    const rows = await this.db
      .select()
      .from(businesses)
      .where(
        and(
          eq(businesses.business_key, businessKey),
          eq(businesses.org_id, orgId),
          isNull(businesses.deleted_at),
        ),
      )
      .limit(1)

    const row = rows[0]
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
    ].filter((f) => f !== undefined)

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

    const total = Number(totalRows[0]?.total ?? 0)

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
    const values: BusinessInsert = {
      business_key: data.business_key,
      org_id: data.org_id,
      name: data.name,
      slug: data.slug,
      status: data.status,
      model: data.model,
      industry: data.industry,
      founded: data.founded,
      website: data.website,
      github_org: data.github_org,
      description: data.description,
      owner_id: data.owner_id,
      ai_owner_id: data.ai_owner_id,
      tags: data.tags ?? [],
      metadata: data.metadata ?? {},
      archived: data.archived,
      archived_at: toDate(data.archived_at),
      archived_by: data.archived_by,
      archive_reason: data.archive_reason,
      deleted_at: toDate(data.deleted_at),
    }

    const [row] = await this.db.insert(businesses).values(values).returning()
    if (!row) throw new Error('Failed to create business')
    return this.mapBusiness(row)
  }

  async update(id: string, orgId: string, data: Partial<BusinessRecord>): Promise<BusinessRecord> {
    const existing = await this.findById(id, orgId)
    if (!existing) throw new Error(`Business not found: ${id}`)

    const patch: Partial<BusinessInsert> = {
      updated_at: new Date(),
      version: existing.version + 1,
    }

    if (data.business_key !== undefined) patch.business_key = data.business_key
    if (data.name !== undefined) patch.name = data.name
    if (data.slug !== undefined) patch.slug = data.slug
    if (data.status !== undefined) patch.status = data.status
    if (data.model !== undefined) patch.model = data.model
    if (data.industry !== undefined) patch.industry = data.industry
    if (data.founded !== undefined) patch.founded = data.founded
    if (data.website !== undefined) patch.website = data.website
    if (data.github_org !== undefined) patch.github_org = data.github_org
    if (data.description !== undefined) patch.description = data.description
    if (data.owner_id !== undefined) patch.owner_id = data.owner_id
    if (data.ai_owner_id !== undefined) patch.ai_owner_id = data.ai_owner_id
    if (data.tags !== undefined) patch.tags = data.tags
    if (data.metadata !== undefined) patch.metadata = data.metadata
    if (data.archived !== undefined) patch.archived = data.archived
    if (data.archived_at !== undefined) patch.archived_at = toDate(data.archived_at)
    if (data.archived_by !== undefined) patch.archived_by = data.archived_by
    if (data.archive_reason !== undefined) patch.archive_reason = data.archive_reason
    if (data.deleted_at !== undefined) patch.deleted_at = toDate(data.deleted_at)

    const [row] = await this.db
      .update(businesses)
      .set(patch)
      .where(and(eq(businesses.id, id), eq(businesses.org_id, orgId), isNull(businesses.deleted_at)))
      .returning()

    if (!row) throw new Error(`Business not found: ${id}`)
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
      archived_at: '',
      archived_by: undefined,
      archive_reason: undefined,
    })
  }

  async softDelete(id: string, orgId: string): Promise<void> {
    await this.update(id, orgId, { deleted_at: new Date().toISOString() })
  }

  async search(options: BusinessSearchOptions): Promise<BusinessSearchResult> {
    const query = `%${options.query.trim()}%`
    const rows = await this.db
      .select()
      .from(businesses)
      .where(
        and(
          eq(businesses.org_id, options.org_id),
          isNull(businesses.deleted_at),
          eq(businesses.archived, false),
          options.filter?.status?.length ? inArray(businesses.status, options.filter.status) : undefined,
          or(
            ilike(businesses.name, query),
            ilike(sql<string>`coalesce(${businesses.description}, '')`, query),
            ilike(sql<string>`coalesce(${businesses.industry}, '')`, query),
            sql<boolean>`exists (select 1 from unnest(${businesses.tags}) tag where tag ilike ${query})`,
          ),
        ),
      )
      .orderBy(desc(businesses.updated_at))
      .limit(options.limit)

    const items = rows.map((row) => this.mapBusiness(row))
    return { items, total: items.length, query: options.query }
  }

  async slugExists(slug: string, orgId: string, excludeId?: string): Promise<boolean> {
    const rows = await this.db
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

    return Number(rows[0]?.total ?? 0) > 0
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

    if (!row) throw new Error('Failed to save business version')
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
    const rows = await this.db
      .select()
      .from(businessVersions)
      .where(and(eq(businessVersions.business_id, businessId), eq(businessVersions.version, version)))
      .limit(1)

    const row = rows[0]
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

    const values: KPIInsert = {
      business_id: data.business_id,
      business_key: data.business_key,
      org_id: data.org_id,
      name: data.name,
      description: data.description,
      unit: data.unit,
      direction: data.direction,
      measurement_period: data.measurement_period,
      target_value: data.target_value.toString(),
      current_value: numToDb(data.current_value),
      previous_value: null,
      warning_threshold: numToDb(data.warning_threshold),
      critical_threshold: numToDb(data.critical_threshold),
      status,
      tags: data.tags,
    }

    const [row] = await this.db.insert(kpis).values(values).returning()
    if (!row) throw new Error('Failed to create KPI')
    return this.mapKPI(row)
  }

  async updateKPI(id: string, orgId: string, data: UpdateKPIData): Promise<KPIRecord> {
    const existing = await this.getKPI(id, orgId)
    if (!existing) throw new Error(`KPI not found: ${id}`)

    const nextCurrent = data.current_value ?? existing.current_value
    const status = this.computeKPIStatus({
      target_value: data.target_value ?? existing.target_value,
      current_value: nextCurrent,
      direction: data.direction ?? existing.direction,
      warning_threshold: data.warning_threshold ?? existing.warning_threshold,
      critical_threshold: data.critical_threshold ?? existing.critical_threshold,
    })

    const patch: Partial<KPIInsert> = {
      updated_at: new Date(),
      status,
      previous_value:
        data.current_value !== undefined ? numToDb(existing.current_value) : numToDb(existing.previous_value),
    }

    if (data.name !== undefined) patch.name = data.name
    if (data.description !== undefined) patch.description = data.description
    if (data.unit !== undefined) patch.unit = data.unit
    if (data.direction !== undefined) patch.direction = data.direction
    if (data.measurement_period !== undefined) patch.measurement_period = data.measurement_period
    if (data.target_value !== undefined) patch.target_value = data.target_value.toString()
    if (data.current_value !== undefined) patch.current_value = data.current_value.toString()
    if (data.warning_threshold !== undefined) patch.warning_threshold = data.warning_threshold.toString()
    if (data.critical_threshold !== undefined) patch.critical_threshold = data.critical_threshold.toString()
    if (data.tags !== undefined) patch.tags = data.tags

    const [row] = await this.db
      .update(kpis)
      .set(patch)
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
    const rows = await this.db
      .select()
      .from(kpis)
      .where(and(eq(kpis.id, id), eq(kpis.org_id, orgId)))
      .limit(1)

    const row = rows[0]
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
    const existingRows = await this.db
      .select()
      .from(businessRelationships)
      .where(
        and(
          eq(businessRelationships.business_id, data.business_id),
          eq(businessRelationships.entity_type, data.entity_type),
          eq(businessRelationships.entity_key, data.entity_key),
        ),
      )
      .limit(1)

    const existing = existingRows[0]
    if (existing) return this.mapRelationship(existing)

    const [row] = await this.db
      .insert(businessRelationships)
      .values({
        ...data,
        metadata: data.metadata ?? {},
      })
      .returning()

    if (!row) throw new Error('Failed to add relationship')
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

    if (!row) throw new Error('Failed to create audit entry')
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
    const [row] = await this.db
      .insert(activityTimeline)
      .values({
        ...data,
        metadata: data.metadata ?? {},
      })
      .returning()

    if (!row) throw new Error('Failed to create activity event')
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
