/**
 * Business Engine — Domain Types
 *
 * Extended types used internally by the Business Engine.
 * These supplement the shared @lifeos/types with engine-specific models.
 */
import type {
  BusinessId,
  BusinessStatus,
  ISODate,
  ISODateTime,
  OrgId,
  UserId,
} from '@lifeos/types'

// ─────────────────────────────────────────────────────────────────────────────
// BUSINESS RECORD (full DB-level record)
// ─────────────────────────────────────────────────────────────────────────────

export interface BusinessRecord {
  id: string // internal UUID (DB PK)
  business_key: BusinessId // BIZ-XXXX stable reference
  org_id: OrgId

  name: string
  slug: string
  status: BusinessStatus
  model?: string
  industry?: string
  founded?: ISODate
  website?: string
  github_org?: string
  description?: string

  owner_id: UserId
  ai_owner_id?: string

  tags: string[]
  metadata: Record<string, unknown>

  archived: boolean
  archived_at?: ISODateTime
  archived_by?: string
  archive_reason?: string

  created_at: ISODateTime
  updated_at: ISODateTime
  deleted_at?: ISODateTime

  version: number
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI RECORD
// ─────────────────────────────────────────────────────────────────────────────

export interface KPIRecord {
  id: string
  business_id: string // internal UUID
  business_key: BusinessId
  org_id: OrgId

  name: string
  description?: string
  unit: string
  direction: 'higher_is_better' | 'lower_is_better' | 'target_range'
  measurement_period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual'

  target_value: number
  current_value?: number
  previous_value?: number
  warning_threshold?: number
  critical_threshold?: number

  status: 'on_track' | 'at_risk' | 'off_track' | 'not_set'

  tags: string[]

  created_at: ISODateTime
  updated_at: ISODateTime
  created_by?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// BUSINESS RELATIONSHIP
// ─────────────────────────────────────────────────────────────────────────────

export interface BusinessRelationshipRecord {
  id: string
  business_id: string
  business_key: BusinessId
  org_id: OrgId

  entity_type: string
  entity_key: string
  relationship_label: string
  metadata: Record<string, unknown>

  created_at: ISODateTime
  created_by: string
}

// ─────────────────────────────────────────────────────────────────────────────
// VERSION HISTORY
// ─────────────────────────────────────────────────────────────────────────────

export interface BusinessVersionRecord {
  id: string
  business_id: string
  business_key: BusinessId
  version: number
  snapshot: BusinessRecord
  changed_by: string
  change_summary?: string
  created_at: ISODateTime
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT LOG ENTRY
// ─────────────────────────────────────────────────────────────────────────────

export interface AuditLogRecord {
  id: string
  org_id: OrgId
  user_id: UserId
  user_email: string

  action: string
  entity_type: string
  entity_id: string
  entity_title?: string

  before_state?: Record<string, unknown>
  after_state?: Record<string, unknown>
  change_diff?: Record<string, unknown>

  ip_address?: string
  user_agent?: string
  request_id?: string

  created_at: ISODateTime
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY EVENT
// ─────────────────────────────────────────────────────────────────────────────

export interface ActivityEventRecord {
  id: string
  org_id: OrgId

  event_type: string
  actor_id: UserId
  actor_name: string
  actor_avatar?: string

  entity_type: string
  entity_id: string
  entity_title: string

  description: string
  metadata: Record<string, unknown>

  created_at: ISODateTime
}

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH SCORE
// ─────────────────────────────────────────────────────────────────────────────

export interface HealthScoreDimension {
  name: string
  score: number
  weight: number
  contributing_factors: string[]
  flags: string[]
}

export interface BusinessHealthScore {
  entity_type: 'business'
  entity_id: string // business_key
  overall_score: number // 0–100
  label: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical'
  dimensions: HealthScoreDimension[]
  recommendations: string[]
  requires_attention: boolean
  computed_at: ISODateTime
}

// ─────────────────────────────────────────────────────────────────────────────
// QUERY OPTIONS
// ─────────────────────────────────────────────────────────────────────────────

export interface BusinessQueryOptions {
  org_id: OrgId
  page: number
  per_page: number
  sort_field: 'name' | 'status' | 'created' | 'updated' | 'health_score'
  sort_order: 'asc' | 'desc'
  filter?: {
    status?: BusinessStatus[]
    model?: string[]
    industry?: string
    tags?: string[]
    archived?: boolean
    owner?: string
    created_after?: ISODate
    created_before?: ISODate
  }
}

export interface PaginatedBusinessResult {
  items: BusinessRecord[]
  total: number
  page: number
  per_page: number
  has_more: boolean
}

export interface BusinessSearchOptions {
  org_id: OrgId
  query: string
  filter?: BusinessQueryOptions['filter']
  limit: number
}

export interface BusinessSearchResult {
  items: BusinessRecord[]
  total: number
  query: string
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE INPUT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateBusinessData {
  org_id: OrgId
  owner_id: UserId
  name: string
  status: BusinessStatus
  model?: string
  industry?: string
  founded?: ISODate
  website?: string
  github_org?: string
  description?: string
  tags: string[]
  metadata?: Record<string, unknown>
}

export interface UpdateBusinessData {
  name?: string
  status?: BusinessStatus
  model?: string
  industry?: string
  founded?: ISODate
  website?: string
  github_org?: string
  description?: string
  tags?: string[]
  metadata?: Record<string, unknown>
}

export interface ArchiveBusinessData {
  archived_by: UserId
  archive_reason?: string
}

export interface CreateKPIData {
  business_id: string // internal UUID
  business_key: BusinessId
  org_id: OrgId
  name: string
  description?: string
  unit: string
  direction: KPIRecord['direction']
  measurement_period: KPIRecord['measurement_period']
  target_value: number
  current_value?: number
  warning_threshold?: number
  critical_threshold?: number
  tags: string[]
}

export interface UpdateKPIData {
  name?: string
  description?: string
  unit?: string
  direction?: KPIRecord['direction']
  measurement_period?: KPIRecord['measurement_period']
  target_value?: number
  current_value?: number
  warning_threshold?: number
  critical_threshold?: number
  tags?: string[]
}

export interface CreateAuditEntryData {
  org_id: OrgId
  user_id: UserId
  user_email: string
  action: string
  entity_type: string
  entity_id: string
  entity_title?: string
  before_state?: Record<string, unknown>
  after_state?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
  request_id?: string
}

export interface CreateActivityEventData {
  org_id: OrgId
  event_type: string
  actor_id: UserId
  actor_name: string
  actor_avatar?: string
  entity_type: string
  entity_id: string
  entity_title: string
  description: string
  metadata?: Record<string, unknown>
}

export interface AddRelationshipData {
  business_id: string
  business_key: BusinessId
  org_id: OrgId
  entity_type: string
  entity_key: string
  relationship_label: string
  metadata?: Record<string, unknown>
  created_by: string
}
