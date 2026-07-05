/**
 * @lifeos/types
 *
 * Canonical TypeScript types for all LifeOS entities.
 * Derived from JSON schemas in /schemas/*.schema.json
 * Do not modify these types without updating the corresponding JSON schema.
 */

// ─────────────────────────────────────────────────────────────────────────────
// SHARED PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

export type ISODate = string // YYYY-MM-DD
export type ISODateTime = string // ISO 8601 datetime

export type EntityId = string

export type BusinessId = `BIZ-${string}`
export type ProjectId = `PRJ-${string}`
export type KnowledgeId = `KNW-${string}`
export type DecisionId = `DEC-${string}`
export type AgentId = `AGT-${string}`
export type AutomationId = `AUT-${string}`
export type RiskId = `RISK-${string}`
export type DeliverableId = `DEL-${string}`
export type PersonId = `PER-${string}`
export type ToolId = `TOOL-${string}`
export type WorkflowId = `WFL-${string}`
export type SOPId = `SOP-${string}`
export type DashboardId = `DSH-${string}`
export type MeetingId = `MTG-${string}`
export type OpportunityId = `OPP-${string}`

export type UserId = string
export type OrgId = string

// ─────────────────────────────────────────────────────────────────────────────
// COMMON ENUMS
// ─────────────────────────────────────────────────────────────────────────────

export type Priority = 'Critical' | 'High' | 'Medium' | 'Low'
export type ImpactLevel = 'High' | 'Medium' | 'Low'
export type HealthFlag = 'Healthy' | 'Stale' | 'At Risk'

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer'

// ─────────────────────────────────────────────────────────────────────────────
// BUSINESS
// ─────────────────────────────────────────────────────────────────────────────

export type BusinessStatus = 'Pre-Launch' | 'Active' | 'Scaling' | 'Mature' | 'Paused' | 'Closed'
export type BusinessModel =
  | 'B2B SaaS'
  | 'B2C SaaS'
  | 'E-commerce'
  | 'Services'
  | 'Marketplace'
  | 'Agency'
  | 'Product'
  | 'Other'

export interface Business {
  id: BusinessId
  name: string
  slug?: string
  status: BusinessStatus
  owner: string
  ai_owner?: string
  model?: BusinessModel
  industry?: string
  founded?: ISODate
  website?: string
  github_org?: string
  description?: string
  kpis?: string[]
  projects?: ProjectId[]
  agents?: AgentId[]
  mcp_connectors?: string[]
  tags?: string[]
  created: ISODate
  updated: ISODate
  archived?: boolean
  metadata?: Record<string, unknown>
}

export interface BusinessHealth {
  business_id: BusinessId
  health_score: number // 0-100
  kpis_off_track: number
  open_risks: number
  projects_active: number
  attention_required: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT
// ─────────────────────────────────────────────────────────────────────────────

export type ProjectStatus = 'Draft' | 'Active' | 'On Hold' | 'In Review' | 'Completed' | 'Cancelled'

export type DeliverableStatus = 'Not Started' | 'In Progress' | 'In Review' | 'Done' | 'Blocked'

export interface Deliverable {
  id: DeliverableId
  title: string
  owner?: string
  due_date?: ISODate
  status: DeliverableStatus
}

export interface Project {
  id: ProjectId
  title: string
  business_id: BusinessId
  status: ProjectStatus
  priority: Priority
  owner: string
  ai_owner?: string
  github_repo?: string
  review_date?: ISODate
  summary?: string
  next_action?: string
  dependencies?: string[]
  deliverables?: Deliverable[]
  risks?: RiskId[]
  decisions?: DecisionId[]
  mcp_connections?: string[]
  automations?: string[]
  documentation?: string[]
  tags?: string[]
  created: ISODate
  updated: ISODate
  completed_date?: ISODate
}

// ─────────────────────────────────────────────────────────────────────────────
// KNOWLEDGE
// ─────────────────────────────────────────────────────────────────────────────

export type KnowledgeStatus = 'Active' | 'Deprecated' | 'Needs Review' | 'Archived'
export type KnowledgeDomain =
  | 'business'
  | 'technology'
  | 'marketing'
  | 'finance'
  | 'legal'
  | 'operations'
  | 'science'
  | 'other'
export type EvidenceQuality = 'Strong' | 'Moderate' | 'Weak'
export type EvidenceType = 'Empirical' | 'Anecdotal' | 'Theoretical' | 'Expert Opinion'
export type SourceType = 'Primary' | 'Secondary' | 'Tertiary'

export interface EvidenceItem {
  description: string
  source?: string
  type?: EvidenceType
  quality: EvidenceQuality
}

export interface KnowledgeSource {
  title: string
  url?: string
  date_accessed?: ISODate
  type?: SourceType
}

export interface AIUsageEntry {
  date?: ISODate
  agent_id?: AgentId
  task?: string
  outcome?: string
}

export interface Knowledge {
  id: KnowledgeId
  title: string
  summary: string
  domain?: KnowledgeDomain
  confidence: number // 0.0 - 1.0
  status: KnowledgeStatus
  evidence?: EvidenceItem[]
  applications?: string[]
  sources?: KnowledgeSource[]
  related_concepts?: KnowledgeId[]
  businesses?: BusinessId[]
  projects?: ProjectId[]
  ai_usage?: AIUsageEntry[]
  tags?: string[]
  created: ISODate
  updated: ISODate
}

// ─────────────────────────────────────────────────────────────────────────────
// DECISION
// ─────────────────────────────────────────────────────────────────────────────

export type DecisionStatus = 'Proposed' | 'Final' | 'Reversed' | 'Superseded'

export interface DecisionOption {
  label: string
  pros?: string[]
  cons?: string[]
  selected?: boolean
}

export interface Decision {
  id: DecisionId
  title: string
  context?: string
  decision: string
  rationale?: string
  made_by: string
  date: ISODate
  status: DecisionStatus
  impact?: ImpactLevel
  reversible?: boolean
  reversal_conditions?: string
  options_considered?: DecisionOption[]
  implications?: string[]
  business_id?: BusinessId
  project_id?: ProjectId
  review_date?: ISODate
  created: ISODate
  updated: ISODate
}

// ─────────────────────────────────────────────────────────────────────────────
// AGENT
// ─────────────────────────────────────────────────────────────────────────────

export type AgentType = 'Orchestrator' | 'Specialist' | 'Analyst' | 'Builder' | 'Reviewer'
export type AgentStatus = 'Draft' | 'Active' | 'Testing' | 'Paused' | 'Deprecated'

export interface IOSpec {
  name: string
  source: string
  format: string
  required?: boolean
}

export interface MemoryConfig {
  short_term_window?: number
  long_term_sources?: string[]
  injected_context?: string[]
}

export interface EscalationRule {
  condition: string
  action: string
  target: string
}

export interface AgentMetrics {
  tasks_per_week?: number
  accuracy_rate?: number // 0-1
  escalation_rate?: number // 0-1
  avg_task_duration_minutes?: number
}

export interface Agent {
  id: AgentId
  name: string
  slug?: string
  type: AgentType
  status: AgentStatus
  model: string
  version?: string
  purpose?: string
  tools?: string[]
  inputs?: IOSpec[]
  outputs?: IOSpec[]
  memory_config?: MemoryConfig
  escalation_rules?: EscalationRule[]
  businesses?: BusinessId[]
  metrics?: AgentMetrics
  created: ISODate
  updated: ISODate
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTOMATION
// ─────────────────────────────────────────────────────────────────────────────

export type AutomationStatus = 'Active' | 'Paused' | 'Testing' | 'Deprecated'
export type AutomationPlatform = 'n8n' | 'Zapier' | 'GitHub Actions' | 'Native' | 'Other'
export type TriggerType = 'Schedule' | 'Event' | 'Webhook' | 'StateChange' | 'Threshold'
export type ActionType =
  | 'RunWorkflow'
  | 'AssignAgent'
  | 'UpdateRecord'
  | 'SendNotification'
  | 'CreateRecord'
  | 'Archive'
export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'contains'
  | 'exists'

export interface AutomationTrigger {
  type: TriggerType
  config?: Record<string, unknown>
}

export interface AutomationAction {
  type: ActionType
  target?: string
  config?: Record<string, unknown>
}

export interface AutomationCondition {
  field: string
  operator: ConditionOperator
  value: unknown
}

export interface Automation {
  id: AutomationId
  name: string
  description?: string
  trigger: AutomationTrigger
  action: AutomationAction
  conditions?: AutomationCondition[]
  status: AutomationStatus
  platform?: AutomationPlatform
  business_id?: BusinessId
  run_count?: number
  last_run?: ISODateTime
  error_count?: number
  created: ISODate
  updated: ISODate
}

// ─────────────────────────────────────────────────────────────────────────────
// RISK
// ─────────────────────────────────────────────────────────────────────────────

export type RiskStatus = 'Open' | 'Mitigated' | 'Accepted' | 'Closed'
export type RiskProbability = 'High' | 'Medium' | 'Low'

export interface Risk {
  id: RiskId
  title: string
  description?: string
  probability?: RiskProbability
  impact?: ImpactLevel
  status: RiskStatus
  mitigation?: string
  owner?: string
  project_id?: ProjectId
  business_id?: BusinessId
  due_date?: ISODate
  created: ISODate
  updated: ISODate
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION
// ─────────────────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'escalation'
  | 'automation_failure'
  | 'agent_alert'
  | 'threshold_breach'
  | 'decision_required'
  | 'review_due'
  | 'blocker_detected'
  | 'mention'
  | 'system'

export type NotificationPriority = 'critical' | 'high' | 'medium' | 'low'

export interface Notification {
  id: string
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  source_entity_type?: EntityType
  source_entity_id?: string
  source_entity_title?: string
  read: boolean
  dismissed: boolean
  created_at: ISODateTime
  read_at?: ISODateTime
  action_url?: string
  metadata?: Record<string, unknown>
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY
// ─────────────────────────────────────────────────────────────────────────────

export type ActivityEventType =
  | 'entity_created'
  | 'entity_updated'
  | 'entity_deleted'
  | 'entity_archived'
  | 'status_changed'
  | 'agent_task_started'
  | 'agent_task_completed'
  | 'agent_task_failed'
  | 'automation_triggered'
  | 'automation_failed'
  | 'decision_made'
  | 'comment_added'
  | 'file_uploaded'
  | 'integration_synced'
  | 'user_login'
  | 'review_completed'

export interface ActivityEvent {
  id: string
  type: ActivityEventType
  actor_id: UserId
  actor_name: string
  actor_avatar?: string
  entity_type: EntityType
  entity_id: string
  entity_title: string
  description: string
  metadata?: Record<string, unknown>
  created_at: ISODateTime
}

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH
// ─────────────────────────────────────────────────────────────────────────────

export type EntityType =
  | 'business'
  | 'project'
  | 'knowledge'
  | 'decision'
  | 'agent'
  | 'automation'
  | 'risk'
  | 'repository'
  | 'person'
  | 'sop'
  | 'workflow'
  | 'page'

export interface SearchResult {
  id: string
  entity_type: EntityType
  title: string
  description?: string
  status?: string
  priority?: string
  tags?: string[]
  updated_at: ISODate
  url: string
  highlight?: string
  relationships?: SearchResultRelationship[]
}

export interface SearchResultRelationship {
  entity_type: EntityType
  entity_id: string
  entity_title: string
  relationship_label: string
}

export interface SearchFilters {
  entity_types?: EntityType[]
  status?: string[]
  priority?: Priority[]
  tags?: string[]
  date_range?: { from?: ISODate; to?: ISODate }
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  page: number
  per_page: number
  query: string
  filters: SearchFilters
}

// ─────────────────────────────────────────────────────────────────────────────
// REPOSITORY
// ─────────────────────────────────────────────────────────────────────────────

export interface RepositoryHealth {
  repo_name: string
  repo_url: string
  open_prs: number
  open_issues: number
  last_commit: ISODate
  days_since_commit: number
  health_flag: HealthFlag
  linked_project_id?: ProjectId
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMAND CENTER
// ─────────────────────────────────────────────────────────────────────────────

export interface PriorityItem {
  item_id: string
  title: string
  priority_score: number
  urgency: 'Critical' | 'Overdue' | 'Due Today' | 'Due This Week' | 'Upcoming'
  entity_type: EntityType
  owner: string
  next_action?: string
  url: string
}

export interface DecisionQueueItem {
  decision_id: DecisionId
  title: string
  blocking: string[]
  days_open: number
  owner: string
  impact?: ImpactLevel
  url: string
}

export interface WaitingOnItem {
  item_id: string
  title: string
  waiting_for: string
  since: ISODate
  days_waiting: number
  entity_type: EntityType
  url: string
}

export interface AIRecommendation {
  id: string
  type:
    | 'unblock'
    | 'review_due'
    | 'stale_project'
    | 'knowledge_gap'
    | 'automation_opportunity'
    | 'agent_suggestion'
    | 'risk_alert'
  title: string
  description: string
  actionability_score: number // 0-100
  entity_type?: EntityType
  entity_id?: string
  entity_url?: string
  suggested_action?: string
  agent_id?: AgentId
}

export interface HighROIItem {
  item_id: string
  title: string
  roi_score: number
  entity_type: EntityType
  url: string
  estimated_value?: string
  estimated_effort?: string
}

export interface AutomationStatusItem {
  automation_id: AutomationId
  name: string
  last_run?: ISODateTime
  last_run_status: 'Success' | 'Failed' | 'Skipped' | 'Never'
  consecutive_failures: number
  requires_attention: boolean
  url: string
}

export interface UpcomingDeadline {
  item_id: string
  title: string
  due_date: ISODate
  days_until: number
  entity_type: EntityType
  owner: string
  url: string
  overdue: boolean
}

export interface CommandCenterData {
  priorities: PriorityItem[]
  decision_queue: DecisionQueueItem[]
  waiting_on: WaitingOnItem[]
  recommendations: AIRecommendation[]
  high_roi: HighROIItem[]
  blocked_work: PriorityItem[]
  upcoming_deadlines: UpcomingDeadline[]
  business_health: BusinessHealth[]
  repository_health: RepositoryHealth[]
  automation_status: AutomationStatusItem[]
  knowledge_review_queue: Knowledge[]
  unread_notifications_count: number
  generated_at: ISODateTime
}

// ─────────────────────────────────────────────────────────────────────────────
// FAVORITES & RECENT
// ─────────────────────────────────────────────────────────────────────────────

export interface FavoriteItem {
  id: string
  entity_type: EntityType
  entity_id: string
  entity_title: string
  url: string
  pinned: boolean
  pinned_order?: number
  created_at: ISODateTime
}

export interface RecentItem {
  entity_type: EntityType
  entity_id: string
  entity_title: string
  url: string
  visited_at: ISODateTime
}

// ─────────────────────────────────────────────────────────────────────────────
// QUICK ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

export interface QuickAction {
  id: string
  label: string
  description?: string
  shortcut?: string
  icon?: string
  entity_type?: EntityType
  action_type: 'navigate' | 'create' | 'agent_task' | 'command' | 'search'
  url?: string
  handler_key?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────────────────────────────────────

export type ThemePreference = 'light' | 'dark' | 'system'
export type LayoutDensity = 'compact' | 'comfortable' | 'spacious'
export type NotificationChannel = 'in_app' | 'email' | 'slack'

export interface UserPreferences {
  theme: ThemePreference
  layout_density: LayoutDensity
  sidebar_collapsed: boolean
  notification_channels: NotificationChannel[]
  command_center_panels: string[]
  date_format: 'relative' | 'absolute' | 'both'
  timezone: string
  default_business_id?: BusinessId
}

export interface OrganizationSettings {
  id: OrgId
  name: string
  slug: string
  plan: 'free' | 'pro' | 'enterprise'
  logo_url?: string
  primary_color?: string
  default_timezone: string
  audit_retention_days: number
  mfa_required: boolean
  sso_enabled: boolean
  allowed_domains?: string[]
}

export interface IntegrationConfig {
  id: string
  name: string
  type: 'github' | 'slack' | 'notion' | 'openai' | 'anthropic' | 'stripe' | 'supabase' | 'vercel' | 'n8n' | 'other'
  status: 'connected' | 'disconnected' | 'error' | 'pending'
  last_synced?: ISODateTime
  error_message?: string
  config?: Record<string, unknown>
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────

export interface User {
  id: UserId
  email: string
  name: string
  avatar_url?: string
  role: UserRole
  org_id: OrgId
  preferences: UserPreferences
  created_at: ISODateTime
  last_seen_at?: ISODateTime
}

export interface Session {
  user: User
  org: OrganizationSettings
  expires_at: ISODateTime
}

// ─────────────────────────────────────────────────────────────────────────────
// API RESPONSES
// ─────────────────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  has_more: boolean
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT LOG
// ─────────────────────────────────────────────────────────────────────────────

export type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'archive'
  | 'login'
  | 'logout'
  | 'invite'
  | 'export'
  | 'agent_dispatch'
  | 'settings_change'
  | 'integration_connect'
  | 'integration_disconnect'

export interface AuditLogEntry {
  id: string
  org_id: OrgId
  user_id: UserId
  user_email: string
  action: AuditAction
  entity_type: EntityType
  entity_id: string
  entity_title?: string
  before_state?: Record<string, unknown>
  after_state?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
  created_at: ISODateTime
}

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH SCORE
// ─────────────────────────────────────────────────────────────────────────────

export interface HealthScoreDimension {
  name: string
  score: number // 0-100
  weight: number // 0-1
  contributing_factors: string[]
  flags: string[]
}

export interface HealthScore {
  entity_type: EntityType
  entity_id: string
  overall_score: number // 0-100
  label: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical'
  dimensions: HealthScoreDimension[]
  computed_at: ISODateTime
  requires_attention: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// MCP REGISTRY
// ─────────────────────────────────────────────────────────────────────────────

export type MCPConnectorStatus = 'active' | 'inactive' | 'error' | 'pending_auth'

export interface MCPCapability {
  name: string
  description: string
  input_schema?: Record<string, unknown>
}

export interface MCPConnector {
  id: string
  name: string
  type: string
  status: MCPConnectorStatus
  description?: string
  capabilities: MCPCapability[]
  auth_type: 'api_key' | 'oauth' | 'token' | 'none'
  last_health_check?: ISODateTime
  health_check_result?: 'pass' | 'fail' | 'unknown'
  error_message?: string
  created_at: ISODateTime
  updated_at: ISODateTime
}

// Re-export everything as a module default for convenience
export type * from './index'
