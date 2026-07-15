import { z } from 'zod'
import {
  AgentIdSchema,
  AutomationIdSchema,
  BusinessIdSchema,
  ISODateSchema,
  PaginationSchema,
  ProjectIdSchema,
  SortOrderSchema,
} from './common.schema.js'

// ─────────────────────────────────────────────────────────────────────────────
// BUSINESS STATUS & ENUMS
// ─────────────────────────────────────────────────────────────────────────────

export const BusinessStatusSchema = z.enum([
  'Pre-Launch',
  'Active',
  'Scaling',
  'Mature',
  'Paused',
  'Closed',
])

export const BusinessModelSchema = z.enum([
  'B2B SaaS',
  'B2C SaaS',
  'E-commerce',
  'Services',
  'Marketplace',
  'Agency',
  'Product',
  'Other',
])

// ─────────────────────────────────────────────────────────────────────────────
// KPI SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const KPIUnitSchema = z.enum([
  'currency',
  'percentage',
  'count',
  'score',
  'time_hours',
  'time_days',
  'custom',
])

export const KPIStatusSchema = z.enum(['on_track', 'at_risk', 'off_track', 'not_set'])

export const KPIDirectionSchema = z.enum(['higher_is_better', 'lower_is_better', 'target_range'])

export const CreateKPISchema = z.object({
  name: z.string().min(1).max(200).trim(),
  description: z.string().max(1000).optional(),
  unit: KPIUnitSchema,
  direction: KPIDirectionSchema,
  target_value: z.number().finite().nonnegative(),
  current_value: z.number().finite().optional(),
  warning_threshold: z.number().finite().optional(),
  critical_threshold: z.number().finite().optional(),
  measurement_period: z
    .enum(['daily', 'weekly', 'monthly', 'quarterly', 'annual'])
    .default('monthly'),
  tags: z.array(z.string().max(50)).max(20).default([]),
})

export const UpdateKPISchema = CreateKPISchema.partial().extend({
  current_value: z.number().finite().optional(),
})

export type CreateKPIInput = z.infer<typeof CreateKPISchema>
export type UpdateKPIInput = z.infer<typeof UpdateKPISchema>

// ─────────────────────────────────────────────────────────────────────────────
// BUSINESS CRUD SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const CreateBusinessSchema = z.object({
  name: z
    .string()
    .min(2, 'Business name must be at least 2 characters')
    .max(100, 'Business name must be at most 100 characters')
    .trim(),
  status: BusinessStatusSchema.default('Pre-Launch'),
  model: BusinessModelSchema.optional(),
  industry: z.string().max(100).trim().optional(),
  founded: ISODateSchema.optional(),
  website: z.string().url('Website must be a valid URL').optional(),
  github_org: z
    .string()
    .max(100)
    .regex(/^[a-zA-Z0-9_-]+$/, 'GitHub org must contain only letters, numbers, hyphens, underscores')
    .optional(),
  description: z.string().max(500, 'Description must be at most 500 characters').trim().optional(),
  tags: z.array(z.string().min(1).max(50)).max(20).default([]),
  metadata: z.record(z.unknown()).optional(),
})

export const UpdateBusinessSchema = CreateBusinessSchema.partial().extend({
  name: z
    .string()
    .min(2)
    .max(100)
    .trim()
    .optional(),
})

export const ArchiveBusinessSchema = z.object({
  reason: z.string().min(1).max(500).trim().optional(),
})

export const RestoreBusinessSchema = z.object({
  reason: z.string().min(1).max(500).trim().optional(),
})

// ─────────────────────────────────────────────────────────────────────────────
// BUSINESS QUERY SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const BusinessSortFieldSchema = z.enum([
  'name',
  'status',
  'created',
  'updated',
  'health_score',
])

export const BusinessFilterSchema = z.object({
  status: z.array(BusinessStatusSchema).optional(),
  model: z.array(BusinessModelSchema).optional(),
  industry: z.string().optional(),
  tags: z.array(z.string()).optional(),
  archived: z.boolean().optional().default(false),
  owner: z.string().optional(),
  has_projects: z.boolean().optional(),
  health_score_min: z.number().min(0).max(100).optional(),
  health_score_max: z.number().min(0).max(100).optional(),
  created_after: ISODateSchema.optional(),
  created_before: ISODateSchema.optional(),
})

export const ListBusinessesSchema = PaginationSchema.extend({
  sort_field: BusinessSortFieldSchema.default('updated'),
  sort_order: SortOrderSchema,
  filter: BusinessFilterSchema.optional(),
})

export const SearchBusinessesSchema = z.object({
  query: z.string().min(1).max(500).trim(),
  filter: BusinessFilterSchema.optional(),
  limit: z.number().int().min(1).max(100).default(20),
})

// ─────────────────────────────────────────────────────────────────────────────
// RELATIONSHIP SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const LinkProjectSchema = z.object({
  project_id: ProjectIdSchema,
})

export const UnlinkProjectSchema = z.object({
  project_id: ProjectIdSchema,
})

export const LinkAgentSchema = z.object({
  agent_id: AgentIdSchema,
})

export const LinkAutomationSchema = z.object({
  automation_id: AutomationIdSchema,
})

// ─────────────────────────────────────────────────────────────────────────────
// TAG SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const AddTagSchema = z.object({
  tag: z
    .string()
    .min(1)
    .max(50)
    .trim()
    .regex(/^[a-z0-9-_]+$/, 'Tags must be lowercase alphanumeric with hyphens/underscores'),
})

export const RemoveTagSchema = z.object({
  tag: z.string().min(1).max(50).trim(),
})

// ─────────────────────────────────────────────────────────────────────────────
// ROUTER INPUT SCHEMAS (tRPC-ready)
// ─────────────────────────────────────────────────────────────────────────────

export const GetByIdSchema = z.object({
  id: z.union([
    BusinessIdSchema,
    z.string().uuid('Must be a valid UUID or BIZ-XXXX key'),
  ], {
    errorMap: () => ({ message: 'Must be a valid business ID (UUID or BIZ-XXXX format)' }),
  }),
})

/** Reusable id field that accepts both BIZ-XXXX keys and internal UUIDs. */
const businessIdField = GetByIdSchema.shape.id

export const GetActivitySchema = z.object({
  id: businessIdField,
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
})

export const GetAuditHistorySchema = z.object({
  id: businessIdField,
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
})

export const GetVersionHistorySchema = z.object({
  id: businessIdField,
  limit: z.number().int().min(1).max(50).default(10),
})

// ─────────────────────────────────────────────────────────────────────────────
// INFERRED TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type BusinessStatus = z.infer<typeof BusinessStatusSchema>
export type BusinessModel = z.infer<typeof BusinessModelSchema>
export type CreateBusinessInput = z.infer<typeof CreateBusinessSchema>
export type UpdateBusinessInput = z.infer<typeof UpdateBusinessSchema>
export type ArchiveBusinessInput = z.infer<typeof ArchiveBusinessSchema>
export type RestoreBusinessInput = z.infer<typeof RestoreBusinessSchema>
export type BusinessFilter = z.infer<typeof BusinessFilterSchema>
export type ListBusinessesInput = z.infer<typeof ListBusinessesSchema>
export type SearchBusinessesInput = z.infer<typeof SearchBusinessesSchema>
export type BusinessSortField = z.infer<typeof BusinessSortFieldSchema>
export type KPIUnit = z.infer<typeof KPIUnitSchema>
export type KPIStatus = z.infer<typeof KPIStatusSchema>
export type KPIDirection = z.infer<typeof KPIDirectionSchema>
