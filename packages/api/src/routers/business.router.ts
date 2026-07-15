/**
 * Business tRPC Router
 *
 * All business management endpoints.
 * Authorization is enforced per-procedure using role-based middleware.
 *
 * Endpoints:
 *  - business.list          GET  /businesses
 *  - business.get           GET  /businesses/:id
 *  - business.getByKey      GET  /businesses/key/:key
 *  - business.create        POST /businesses
 *  - business.update        PATCH /businesses/:id
 *  - business.archive       POST /businesses/:id/archive
 *  - business.restore       POST /businesses/:id/restore
 *  - business.search        GET  /businesses/search
 *  - business.addTag        POST /businesses/:id/tags
 *  - business.removeTag     DELETE /businesses/:id/tags/:tag
 *  - business.getHealth     GET  /businesses/:id/health
 *  - business.getActivity   GET  /businesses/:id/activity
 *  - business.getAuditHistory GET /businesses/:id/audit
 *  - business.getVersionHistory GET /businesses/:id/versions
 *  - business.getVersionAt  GET  /businesses/:id/versions/:version
 *  - business.createKPI     POST /businesses/:id/kpis
 *  - business.updateKPI     PATCH /businesses/:id/kpis/:kpiId
 *  - business.deleteKPI     DELETE /businesses/:id/kpis/:kpiId
 *  - business.listKPIs      GET  /businesses/:id/kpis
 *  - business.getRelationships GET /businesses/:id/relationships
 *  - business.linkEntity    POST /businesses/:id/relationships
 *  - business.unlinkEntity  DELETE /businesses/:id/relationships
 */
import { z } from 'zod'
import {
  AddTagSchema,
  ArchiveBusinessSchema,
  CreateBusinessSchema,
  CreateKPISchema,
  GetActivitySchema,
  GetAuditHistorySchema,
  GetByIdSchema,
  GetVersionHistorySchema,
  ListBusinessesSchema,
  RemoveTagSchema,
  RestoreBusinessSchema,
  SearchBusinessesSchema,
  UpdateBusinessSchema,
  UpdateKPISchema,
} from '@lifeos/validators'
import { adminProcedure, memberProcedure, router, viewerProcedure } from '../trpc.js'
import { BusinessService } from '../services/business/business.service.js'
import { InMemoryBusinessRepository } from '../services/business/business.repository.js'

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE FACTORY
// Allows injection of a different repository in tests.
// ─────────────────────────────────────────────────────────────────────────────

let _serviceInstance: BusinessService | null = null

export function getBusinessService(repo?: InstanceType<typeof InMemoryBusinessRepository>): BusinessService {
  if (repo) {
    return new BusinessService(repo)
  }
  if (_serviceInstance === null) {
    _serviceInstance = new BusinessService(new InMemoryBusinessRepository())
  }
  return _serviceInstance
}

/** Reset the service singleton (for testing). */
export function resetBusinessService(): void {
  _serviceInstance = null
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTER
// ─────────────────────────────────────────────────────────────────────────────

export const businessRouter = router({
  // ── List ───────────────────────────────────────────────────────────────

  list: viewerProcedure.input(ListBusinessesSchema).query(async ({ ctx, input }) => {
    const service = getBusinessService()
    return service.list({
      org_id: ctx.org_id,
      page: input.page,
      per_page: input.per_page,
      sort_field: input.sort_field,
      sort_order: input.sort_order,
      filter: input.filter
        ? {
            ...input.filter,
            archived: input.filter.archived ?? false,
          }
        : { archived: false },
    })
  }),

  // ── Get by internal ID ────────────────────────────────────────────────

  get: viewerProcedure.input(GetByIdSchema).query(async ({ ctx, input }) => {
    const service = getBusinessService()
    return service.getByKey(input.id, ctx.org_id)
  }),

  // ── Get by BIZ-XXXX key ───────────────────────────────────────────────

  getByKey: viewerProcedure
    .input(z.object({ key: z.string().regex(/^BIZ-[A-Z0-9]{4,}$/) }))
    .query(async ({ ctx, input }) => {
      const service = getBusinessService()
      return service.getByKey(input.key, ctx.org_id)
    }),

  // ── Create ────────────────────────────────────────────────────────────

  create: memberProcedure.input(CreateBusinessSchema).mutation(async ({ ctx, input }) => {
    const service = getBusinessService()
    return service.create(
      {
        name: input.name,
        status: input.status,
        model: input.model,
        industry: input.industry,
        founded: input.founded,
        website: input.website,
        github_org: input.github_org,
        description: input.description,
        tags: input.tags,
        metadata: input.metadata,
      },
      ctx.user,
    )
  }),

  // ── Update ────────────────────────────────────────────────────────────

  update: memberProcedure
    .input(z.object({ id: GetByIdSchema.shape.id, data: UpdateBusinessSchema }))
    .mutation(async ({ ctx, input }) => {
      const service = getBusinessService()
      const business = await service.getByKey(input.id, ctx.org_id)
      return service.update(business.id, input.data, ctx.user)
    }),

  // ── Archive ───────────────────────────────────────────────────────────

  archive: adminProcedure
    .input(z.object({ id: GetByIdSchema.shape.id, data: ArchiveBusinessSchema.optional() }))
    .mutation(async ({ ctx, input }) => {
      const service = getBusinessService()
      const business = await service.getByKey(input.id, ctx.org_id)
      return service.archive(business.id, input.data?.reason, ctx.user)
    }),

  // ── Restore ───────────────────────────────────────────────────────────

  restore: adminProcedure
    .input(z.object({ id: GetByIdSchema.shape.id, data: RestoreBusinessSchema.optional() }))
    .mutation(async ({ ctx, input }) => {
      const service = getBusinessService()
      const business = await service.getByKey(input.id, ctx.org_id)
      return service.restore(business.id, ctx.user)
    }),

  // ── Search ────────────────────────────────────────────────────────────

  search: viewerProcedure.input(SearchBusinessesSchema).query(async ({ ctx, input }) => {
    const service = getBusinessService()
    return service.search({
      org_id: ctx.org_id,
      query: input.query,
      filter: input.filter,
      limit: input.limit,
    })
  }),

  // ── Tags ──────────────────────────────────────────────────────────────

  addTag: memberProcedure
    .input(z.object({ id: GetByIdSchema.shape.id, data: AddTagSchema }))
    .mutation(async ({ ctx, input }) => {
      const service = getBusinessService()
      const business = await service.getByKey(input.id, ctx.org_id)
      return service.addTag(business.id, input.data.tag, ctx.user)
    }),

  removeTag: memberProcedure
    .input(z.object({ id: GetByIdSchema.shape.id, data: RemoveTagSchema }))
    .mutation(async ({ ctx, input }) => {
      const service = getBusinessService()
      const business = await service.getByKey(input.id, ctx.org_id)
      return service.removeTag(business.id, input.data.tag, ctx.user)
    }),

  // ── Health ────────────────────────────────────────────────────────────

  getHealth: viewerProcedure
    .input(
      z.object({
        id: GetByIdSchema.shape.id,
        signals: z.object({
          projects: z.object({
            total: z.number().int().min(0),
            active: z.number().int().min(0),
            stale: z.number().int().min(0),
            blocked: z.number().int().min(0),
            overdue: z.number().int().min(0),
            completed_this_month: z.number().int().min(0),
          }),
          agents: z.object({
            total_active: z.number().int().min(0),
            tasks_completed_this_week: z.number().int().min(0),
            escalations_this_week: z.number().int().min(0),
            error_rate: z.number().min(0).max(1),
          }),
          automations: z.object({
            total_active: z.number().int().min(0),
            success_rate_30d: z.number().min(0).max(1),
            consecutive_failures: z.number().int().min(0),
            runs_last_7d: z.number().int().min(0),
          }),
          knowledge: z.object({
            total_linked: z.number().int().min(0),
            needs_review: z.number().int().min(0),
            recently_added: z.number().int().min(0),
          }),
          repositories: z.object({
            total_linked: z.number().int().min(0),
            healthy: z.number().int().min(0),
            stale: z.number().int().min(0),
            at_risk: z.number().int().min(0),
            avg_days_since_commit: z.number().min(0),
          }),
        }),
      }),
    )
    .query(async ({ ctx, input }) => {
      const service = getBusinessService()
      const business = await service.getByKey(input.id, ctx.org_id)
      return service.computeHealth(business.id, ctx.org_id, {
        projects: input.signals.projects,
        agents: input.signals.agents,
        automations: input.signals.automations,
        knowledge: input.signals.knowledge,
        repositories: input.signals.repositories,
      })
    }),

  // ── Activity ──────────────────────────────────────────────────────────

  getActivity: viewerProcedure.input(GetActivitySchema).query(async ({ ctx, input }) => {
    const service = getBusinessService()
    const business = await service.getByKey(input.id, ctx.org_id)
    return service.getActivityTimeline(business.id, ctx.org_id, input.limit, input.cursor)
  }),

  // ── Audit history ─────────────────────────────────────────────────────

  getAuditHistory: adminProcedure.input(GetAuditHistorySchema).query(async ({ ctx, input }) => {
    const service = getBusinessService()
    const business = await service.getByKey(input.id, ctx.org_id)
    return service.getAuditHistory(business.id, ctx.org_id, input.limit, input.cursor)
  }),

  // ── Version history ───────────────────────────────────────────────────

  getVersionHistory: viewerProcedure
    .input(GetVersionHistorySchema)
    .query(async ({ ctx, input }) => {
      const service = getBusinessService()
      const business = await service.getByKey(input.id, ctx.org_id)
      return service.getVersionHistory(business.id, ctx.org_id, input.limit)
    }),

  getVersionAt: viewerProcedure
    .input(z.object({ id: GetByIdSchema.shape.id, version: z.number().int().min(1) }))
    .query(async ({ ctx, input }) => {
      const service = getBusinessService()
      const business = await service.getByKey(input.id, ctx.org_id)
      return service.getVersionAt(business.id, input.version, ctx.org_id)
    }),

  // ── KPIs ──────────────────────────────────────────────────────────────

  listKPIs: viewerProcedure.input(GetByIdSchema).query(async ({ ctx, input }) => {
    const service = getBusinessService()
    const business = await service.getByKey(input.id, ctx.org_id)
    return service.listKPIs(business.id, ctx.org_id)
  }),

  createKPI: memberProcedure
    .input(z.object({ id: GetByIdSchema.shape.id, data: CreateKPISchema }))
    .mutation(async ({ ctx, input }) => {
      const service = getBusinessService()
      const business = await service.getByKey(input.id, ctx.org_id)
      return service.createKPI(
        business.id,
        {
          name: input.data.name,
          description: input.data.description,
          unit: input.data.unit,
          direction: input.data.direction,
          measurement_period: input.data.measurement_period,
          target_value: input.data.target_value,
          current_value: input.data.current_value,
          warning_threshold: input.data.warning_threshold,
          critical_threshold: input.data.critical_threshold,
          tags: input.data.tags,
        },
        ctx.user,
      )
    }),

  updateKPI: memberProcedure
    .input(
      z.object({
        id: GetByIdSchema.shape.id,
        kpi_id: z.string().uuid(),
        data: UpdateKPISchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const service = getBusinessService()
      return service.updateKPI(input.kpi_id, input.data, ctx.user)
    }),

  deleteKPI: adminProcedure
    .input(z.object({ id: GetByIdSchema.shape.id, kpi_id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const service = getBusinessService()
      await service.deleteKPI(input.kpi_id, ctx.user)
    }),

  // ── Relationships ─────────────────────────────────────────────────────

  getRelationships: viewerProcedure.input(GetByIdSchema).query(async ({ ctx, input }) => {
    const service = getBusinessService()
    const business = await service.getByKey(input.id, ctx.org_id)
    return service.getRelationships(business.id, ctx.org_id)
  }),

  linkEntity: memberProcedure
    .input(
      z.object({
        id: GetByIdSchema.shape.id,
        entity_type: z.enum([
          'project', 'knowledge', 'agent', 'automation', 'person',
          'repository', 'meeting', 'document', 'finance_account',
          'crm_contact', 'dashboard', 'sop', 'workflow',
        ]),
        entity_key: z.string().min(1).max(100),
        metadata: z.record(z.unknown()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const service = getBusinessService()
      const business = await service.getByKey(input.id, ctx.org_id)
      await service.linkEntity(
        business.id,
        input.entity_type,
        input.entity_key,
        ctx.user,
        input.metadata,
      )
      return { success: true }
    }),

  unlinkEntity: memberProcedure
    .input(
      z.object({
        id: GetByIdSchema.shape.id,
        entity_type: z.enum([
          'project', 'knowledge', 'agent', 'automation', 'person',
          'repository', 'meeting', 'document', 'finance_account',
          'crm_contact', 'dashboard', 'sop', 'workflow',
        ]),
        entity_key: z.string().min(1).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const service = getBusinessService()
      const business = await service.getByKey(input.id, ctx.org_id)
      await service.unlinkEntity(
        business.id,
        input.entity_type,
        input.entity_key,
        ctx.user,
      )
      return { success: true }
    }),
})

export type BusinessRouter = typeof businessRouter
