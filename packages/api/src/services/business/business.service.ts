/**
 * Business Service
 *
 * Orchestrates all business operations: CRUD, archival, search, tags,
 * version history, KPI management, health scoring, and relationships.
 *
 * Authorization is enforced in the tRPC router layer.
 * This service assumes the caller has been authenticated and authorized.
 * Audit logging and activity recording happen for all write operations.
 */
import { TRPCError } from '@trpc/server'
import type { AuthenticatedUser } from '../../trpc.js'
import { BusinessHealthEngine, type BusinessHealthInputs } from './business-health.engine.js'
import type { IBusinessRepository } from './business.repository.js'
import { KPIService, type KPIWithTrend } from './kpi.service.js'
import { RelationshipEngine, type BusinessRelationshipMap, type RelationshipEntityType, type RelationshipSummary } from './relationship.engine.js'
import type {
  ActivityEventRecord,
  AuditLogRecord,
  BusinessHealthScore,
  BusinessRecord,
  BusinessVersionRecord,
  CreateKPIData,
  KPIRecord,
  PaginatedBusinessResult,
  BusinessSearchResult,
  BusinessQueryOptions,
  BusinessSearchOptions,
  UpdateKPIData,
} from './types.js'

// ─────────────────────────────────────────────────────────────────────────────
// SLUG GENERATION
// ─────────────────────────────────────────────────────────────────────────────

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

function generateBusinessKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let key = 'BIZ-'
  for (let i = 0; i < 6; i++) {
    key += chars[Math.floor(Math.random() * chars.length)]
  }
  return key
}

// ─────────────────────────────────────────────────────────────────────────────
// INPUT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateBusinessInput {
  name: string
  status: string
  model?: string
  industry?: string
  founded?: string
  website?: string
  github_org?: string
  description?: string
  tags: string[]
  metadata?: Record<string, unknown>
}

export interface UpdateBusinessInput {
  name?: string
  status?: string
  model?: string
  industry?: string
  founded?: string
  website?: string
  github_org?: string
  description?: string
  tags?: string[]
  metadata?: Record<string, unknown>
}

// ─────────────────────────────────────────────────────────────────────────────
// BUSINESS SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export class BusinessService {
  private readonly healthEngine: BusinessHealthEngine
  readonly kpiService: KPIService
  readonly relationshipEngine: RelationshipEngine

  constructor(
    private readonly repo: IBusinessRepository,
    private readonly defaultOrgId?: string,
  ) {
    this.healthEngine = new BusinessHealthEngine()
    this.kpiService = new KPIService(repo)
    this.relationshipEngine = new RelationshipEngine(repo)
  }

  // ─── Create ─────────────────────────────────────────────────────────────

  async create(
    input: CreateBusinessInput,
    actor: AuthenticatedUser,
  ): Promise<BusinessRecord> {
    // Generate a URL-safe slug and ensure it's unique within the org
    let slug = generateSlug(input.name)
    let slugSuffix = 1

    while (await this.repo.slugExists(slug, actor.org_id)) {
      slug = `${generateSlug(input.name)}-${slugSuffix}`
      slugSuffix++
    }

    // Generate a stable BIZ-XXXX key (retry if collision)
    let business_key = generateBusinessKey()
    while (await this.repo.findByKey(business_key, actor.org_id) !== null) {
      business_key = generateBusinessKey()
    }

    const record = await this.repo.create({
      business_key: business_key as `BIZ-${string}`,
      org_id: actor.org_id,
      name: input.name,
      slug,
      status: input.status as BusinessRecord['status'],
      model: input.model,
      industry: input.industry,
      founded: input.founded,
      website: input.website,
      github_org: input.github_org,
      description: input.description,
      owner_id: actor.id,
      tags: input.tags,
      metadata: input.metadata ?? {},
      archived: false,
    })

    // Save initial version
    await this.repo.saveVersion(
      record.id,
      1,
      record,
      actor.id,
      'Initial creation',
    )

    // Record audit + activity
    await Promise.all([
      this.repo.createAuditEntry({
        org_id: actor.org_id,
        user_id: actor.id,
        user_email: actor.email,
        action: 'create',
        entity_type: 'business',
        entity_id: record.business_key,
        entity_title: record.name,
        after_state: record as unknown as Record<string, unknown>,
      }),
      this.repo.createActivityEvent({
        org_id: actor.org_id,
        event_type: 'entity_created',
        actor_id: actor.id,
        actor_name: actor.name,
        entity_type: 'business',
        entity_id: record.business_key,
        entity_title: record.name,
        description: `Created business "${record.name}"`,
      }),
    ])

    return record
  }

  // ─── Read ────────────────────────────────────────────────────────────────

  async getById(id: string, orgId: string): Promise<BusinessRecord> {
    const record = await this.repo.findById(id, orgId)
    if (!record) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Business not found.`,
      })
    }
    return record
  }

  async getByKey(businessKeyOrId: string, orgId: string): Promise<BusinessRecord> {
    // Try BIZ-key first (pattern: BIZ-XXXXXX)
    if (businessKeyOrId.startsWith('BIZ-')) {
      const byKey = await this.repo.findByKey(businessKeyOrId, orgId)
      if (byKey) return byKey
    }

    // Fall back to internal UUID lookup
    const byId = await this.repo.findById(businessKeyOrId, orgId)
    if (byId) return byId

    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `Business "${businessKeyOrId}" not found.`,
    })
  }

  async list(options: BusinessQueryOptions): Promise<PaginatedBusinessResult> {
    return this.repo.findMany(options)
  }

  async search(options: BusinessSearchOptions): Promise<BusinessSearchResult> {
    return this.repo.search(options)
  }

  // ─── Update ──────────────────────────────────────────────────────────────

  async update(
    id: string,
    input: UpdateBusinessInput,
    actor: AuthenticatedUser,
  ): Promise<BusinessRecord> {
    const existing = await this.getById(id, actor.org_id)

    if (existing.archived) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Cannot update an archived business. Restore it first.',
      })
    }

    // If name is changing, update slug too (if new slug is available)
    let slugUpdate: { slug?: string } = {}
    if (input.name && input.name !== existing.name) {
      const newSlug = generateSlug(input.name)
      const slugInUse = await this.repo.slugExists(newSlug, actor.org_id, id)
      if (!slugInUse) {
        slugUpdate = { slug: newSlug }
      }
    }

    const updated = await this.repo.update(id, actor.org_id, {
      ...input,
      status: input.status as BusinessRecord['status'] | undefined,
      ...slugUpdate,
    })

    // Save version snapshot
    await this.repo.saveVersion(
      id,
      updated.version,
      updated,
      actor.id,
      this.summarizeChanges(existing, updated),
    )

    // Audit + activity
    await Promise.all([
      this.repo.createAuditEntry({
        org_id: actor.org_id,
        user_id: actor.id,
        user_email: actor.email,
        action: 'update',
        entity_type: 'business',
        entity_id: updated.business_key,
        entity_title: updated.name,
        before_state: existing as unknown as Record<string, unknown>,
        after_state: updated as unknown as Record<string, unknown>,
      }),
      this.repo.createActivityEvent({
        org_id: actor.org_id,
        event_type: 'entity_updated',
        actor_id: actor.id,
        actor_name: actor.name,
        entity_type: 'business',
        entity_id: updated.business_key,
        entity_title: updated.name,
        description: `Updated business "${updated.name}"`,
        metadata: { changes: this.summarizeChanges(existing, updated) },
      }),
    ])

    return updated
  }

  // ─── Archive / Restore ───────────────────────────────────────────────────

  async archive(
    id: string,
    reason: string | undefined,
    actor: AuthenticatedUser,
  ): Promise<BusinessRecord> {
    const existing = await this.getById(id, actor.org_id)

    if (existing.archived) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Business is already archived.',
      })
    }

    const archived = await this.repo.archive(id, actor.org_id, actor.id, reason)

    await Promise.all([
      this.repo.saveVersion(id, archived.version, archived, actor.id, 'Archived'),
      this.repo.createAuditEntry({
        org_id: actor.org_id,
        user_id: actor.id,
        user_email: actor.email,
        action: 'archive',
        entity_type: 'business',
        entity_id: archived.business_key,
        entity_title: archived.name,
        before_state: existing as unknown as Record<string, unknown>,
        after_state: archived as unknown as Record<string, unknown>,
      }),
      this.repo.createActivityEvent({
        org_id: actor.org_id,
        event_type: 'entity_archived',
        actor_id: actor.id,
        actor_name: actor.name,
        entity_type: 'business',
        entity_id: archived.business_key,
        entity_title: archived.name,
        description: `Archived business "${archived.name}"${reason ? `: ${reason}` : ''}`,
      }),
    ])

    return archived
  }

  async restore(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<BusinessRecord> {
    const existing = await this.getById(id, actor.org_id)

    if (!existing.archived) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Business is not archived.',
      })
    }

    const restored = await this.repo.restore(id, actor.org_id, actor.id)

    await Promise.all([
      this.repo.saveVersion(id, restored.version, restored, actor.id, 'Restored from archive'),
      this.repo.createAuditEntry({
        org_id: actor.org_id,
        user_id: actor.id,
        user_email: actor.email,
        action: 'restore',
        entity_type: 'business',
        entity_id: restored.business_key,
        entity_title: restored.name,
        before_state: existing as unknown as Record<string, unknown>,
        after_state: restored as unknown as Record<string, unknown>,
      }),
      this.repo.createActivityEvent({
        org_id: actor.org_id,
        event_type: 'entity_updated',
        actor_id: actor.id,
        actor_name: actor.name,
        entity_type: 'business',
        entity_id: restored.business_key,
        entity_title: restored.name,
        description: `Restored business "${restored.name}" from archive`,
      }),
    ])

    return restored
  }

  // ─── Tags ────────────────────────────────────────────────────────────────

  async addTag(id: string, tag: string, actor: AuthenticatedUser): Promise<BusinessRecord> {
    const normalizedTag = tag.toLowerCase().trim()
    const existing = await this.getById(id, actor.org_id)

    if (existing.tags.includes(normalizedTag)) {
      return existing // idempotent
    }

    return this.update(id, { tags: [...existing.tags, normalizedTag] }, actor)
  }

  async removeTag(id: string, tag: string, actor: AuthenticatedUser): Promise<BusinessRecord> {
    const normalizedTag = tag.toLowerCase().trim()
    const existing = await this.getById(id, actor.org_id)

    if (!existing.tags.includes(normalizedTag)) {
      return existing // idempotent
    }

    return this.update(id, { tags: existing.tags.filter((t) => t !== normalizedTag) }, actor)
  }

  // ─── KPIs ────────────────────────────────────────────────────────────────

  async createKPI(
    businessId: string,
    input: Omit<CreateKPIData, 'business_id' | 'business_key' | 'org_id'>,
    actor: AuthenticatedUser,
  ): Promise<KPIRecord> {
    const business = await this.getById(businessId, actor.org_id)

    const kpi = await this.kpiService.create({
      ...input,
      business_id: business.id,
      business_key: business.business_key,
      org_id: actor.org_id,
    })

    await Promise.all([
      this.repo.createAuditEntry({
        org_id: actor.org_id,
        user_id: actor.id,
        user_email: actor.email,
        action: 'create',
        entity_type: 'kpi',
        entity_id: kpi.id,
        entity_title: kpi.name,
        after_state: kpi as unknown as Record<string, unknown>,
      }),
      this.repo.createActivityEvent({
        org_id: actor.org_id,
        event_type: 'entity_created',
        actor_id: actor.id,
        actor_name: actor.name,
        entity_type: 'business',
        entity_id: business.business_key,
        entity_title: business.name,
        description: `Added KPI "${kpi.name}" to ${business.name}`,
      }),
    ])

    return kpi
  }

  async updateKPI(
    kpiId: string,
    input: UpdateKPIData,
    actor: AuthenticatedUser,
  ): Promise<KPIRecord> {
    const existing = await this.repo.getKPI(kpiId, actor.org_id)
    if (!existing) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'KPI not found.' })
    }

    const updated = await this.kpiService.update(kpiId, actor.org_id, input)

    await Promise.all([
      this.repo.createAuditEntry({
        org_id: actor.org_id,
        user_id: actor.id,
        user_email: actor.email,
        action: 'update',
        entity_type: 'kpi',
        entity_id: kpiId,
        entity_title: updated.name,
        before_state: existing as unknown as Record<string, unknown>,
        after_state: updated as unknown as Record<string, unknown>,
      }),
      this.repo.createActivityEvent({
        org_id: actor.org_id,
        event_type: 'entity_updated',
        actor_id: actor.id,
        actor_name: actor.name,
        entity_type: 'business',
        entity_id: updated.business_key,
        entity_title: updated.name,
        description: `Updated KPI "${updated.name}"`,
      }),
    ])

    return updated
  }

  async deleteKPI(kpiId: string, actor: AuthenticatedUser): Promise<void> {
    const existing = await this.repo.getKPI(kpiId, actor.org_id)
    if (!existing) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'KPI not found.' })
    }

    await this.kpiService.delete(kpiId, actor.org_id)

    await this.repo.createAuditEntry({
      org_id: actor.org_id,
      user_id: actor.id,
      user_email: actor.email,
      action: 'delete',
      entity_type: 'kpi',
      entity_id: kpiId,
      entity_title: existing.name,
      before_state: existing as unknown as Record<string, unknown>,
    })
  }

  async listKPIs(businessId: string, orgId: string): Promise<KPIWithTrend[]> {
    const business = await this.getById(businessId, orgId)
    return this.kpiService.listForBusiness(business.id, orgId)
  }

  // ─── Health ──────────────────────────────────────────────────────────────

  async computeHealth(
    businessId: string,
    orgId: string,
    signals: Omit<BusinessHealthInputs, 'business' | 'kpis'>,
  ): Promise<BusinessHealthScore> {
    const business = await this.getById(businessId, orgId)
    const kpis = await this.repo.listKPIs(business.id, orgId)

    return this.healthEngine.compute({ business, kpis, ...signals })
  }

  // ─── Relationships ───────────────────────────────────────────────────────

  async linkEntity(
    businessId: string,
    entityType: RelationshipEntityType,
    entityKey: string,
    actor: AuthenticatedUser,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const business = await this.getById(businessId, actor.org_id)

    await this.relationshipEngine.link(
      business.id,
      business.business_key,
      actor.org_id,
      entityType,
      entityKey,
      actor.id,
      metadata,
    )

    await this.repo.createActivityEvent({
      org_id: actor.org_id,
      event_type: 'entity_updated',
      actor_id: actor.id,
      actor_name: actor.name,
      entity_type: 'business',
      entity_id: business.business_key,
      entity_title: business.name,
      description: `Linked ${entityType} ${entityKey} to ${business.name}`,
    })
  }

  async unlinkEntity(
    businessId: string,
    entityType: RelationshipEntityType,
    entityKey: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const business = await this.getById(businessId, actor.org_id)

    await this.relationshipEngine.unlink(business.id, entityType, entityKey, actor.org_id)

    await this.repo.createActivityEvent({
      org_id: actor.org_id,
      event_type: 'entity_updated',
      actor_id: actor.id,
      actor_name: actor.name,
      entity_type: 'business',
      entity_id: business.business_key,
      entity_title: business.name,
      description: `Unlinked ${entityType} ${entityKey} from ${business.name}`,
    })
  }

  async getRelationships(businessId: string, orgId: string): Promise<RelationshipSummary[]> {
    const business = await this.getById(businessId, orgId)
    const all = await this.repo.listRelationships(business.id, orgId)
    return all.map((r) => ({
      entity_type: r.entity_type as RelationshipEntityType,
      entity_key: r.entity_key,
      relationship_label: r.relationship_label,
      metadata: r.metadata,
      created_at: r.created_at,
    }))
  }

  async getRelationshipMap(businessId: string, orgId: string): Promise<BusinessRelationshipMap> {
    const business = await this.getById(businessId, orgId)
    return this.relationshipEngine.getMap(business.id, orgId)
  }

  // ─── Version history ─────────────────────────────────────────────────────

  async getVersionHistory(
    businessId: string,
    orgId: string,
    limit = 10,
  ): Promise<BusinessVersionRecord[]> {
    const business = await this.getById(businessId, orgId)
    return this.repo.getVersionHistory(business.id, orgId, limit)
  }

  async getVersionAt(
    businessId: string,
    version: number,
    orgId: string,
  ): Promise<BusinessVersionRecord> {
    const business = await this.getById(businessId, orgId)
    const record = await this.repo.getVersionAt(business.id, version, orgId)

    if (!record) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Version ${version} not found for this business.`,
      })
    }

    return record
  }

  // ─── Activity & Audit ────────────────────────────────────────────────────

  async getActivityTimeline(
    businessId: string,
    orgId: string,
    limit = 20,
    cursor?: string,
  ): Promise<{ events: ActivityEventRecord[]; nextCursor: string | null }> {
    const business = await this.getById(businessId, orgId)
    return this.repo.getActivityTimeline('business', business.business_key, orgId, limit, cursor)
  }

  async getAuditHistory(
    businessId: string,
    orgId: string,
    limit = 20,
    cursor?: string,
  ): Promise<{ entries: AuditLogRecord[]; nextCursor: string | null }> {
    const business = await this.getById(businessId, orgId)
    return this.repo.getAuditHistory('business', business.business_key, orgId, limit, cursor)
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private summarizeChanges(before: BusinessRecord, after: BusinessRecord): string {
    const changed: string[] = []
    const fields: Array<keyof BusinessRecord> = [
      'name', 'status', 'model', 'industry', 'description', 'website',
      'github_org', 'founded', 'tags',
    ]

    for (const field of fields) {
      if (JSON.stringify(before[field]) !== JSON.stringify(after[field])) {
        changed.push(field)
      }
    }

    if (changed.length === 0) return 'No changes'
    return `Updated: ${changed.join(', ')}`
  }
}
