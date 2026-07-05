import { pgTable, uuid, text, boolean, integer, numeric, timestamp, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ─────────────────────────────────────────────────────────────────────────────
// BUSINESSES TABLE
// ─────────────────────────────────────────────────────────────────────────────

export const businesses = pgTable(
  'businesses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /**
     * The BIZ-XXXX identifier used across the LifeOS system.
     * Separate from the internal UUID primary key to support stable references.
     */
    business_key: text('business_key').notNull().unique(), // BIZ-XXXX
    org_id: uuid('org_id').notNull(),

    name: text('name').notNull(),
    slug: text('slug').notNull(),
    status: text('status').notNull().default('Pre-Launch'),
    model: text('model'),
    industry: text('industry'),
    founded: text('founded'), // ISO date string
    website: text('website'),
    github_org: text('github_org'),
    description: text('description'),

    owner_id: text('owner_id').notNull(),
    ai_owner_id: text('ai_owner_id'),

    tags: text('tags').array().notNull().default([]),
    metadata: jsonb('metadata').default({}),

    archived: boolean('archived').notNull().default(false),
    archived_at: timestamp('archived_at', { withTimezone: true }),
    archived_by: text('archived_by'),
    archive_reason: text('archive_reason'),

    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),

    version: integer('version').notNull().default(1),
  },
  (table) => ({
    orgIdx: index('businesses_org_id_idx').on(table.org_id),
    statusIdx: index('businesses_status_idx').on(table.status),
    slugOrgUniq: uniqueIndex('businesses_slug_org_uniq').on(table.slug, table.org_id),
    archivedIdx: index('businesses_archived_idx').on(table.archived),
    tagsIdx: index('businesses_tags_idx').on(table.tags),
  }),
)

// ─────────────────────────────────────────────────────────────────────────────
// BUSINESS VERSION HISTORY TABLE
// ─────────────────────────────────────────────────────────────────────────────

export const businessVersions = pgTable(
  'business_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    business_id: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    snapshot: jsonb('snapshot').notNull(), // full business record at this version
    changed_by: text('changed_by').notNull(),
    change_summary: text('change_summary'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    businessVersionIdx: index('business_versions_business_id_idx').on(table.business_id),
    versionUniq: uniqueIndex('business_versions_version_uniq').on(
      table.business_id,
      table.version,
    ),
  }),
)

// ─────────────────────────────────────────────────────────────────────────────
// KPIs TABLE
// ─────────────────────────────────────────────────────────────────────────────

export const kpis = pgTable(
  'kpis',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    business_id: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    org_id: uuid('org_id').notNull(),

    name: text('name').notNull(),
    description: text('description'),
    unit: text('unit').notNull(),
    direction: text('direction').notNull().default('higher_is_better'),
    measurement_period: text('measurement_period').notNull().default('monthly'),

    target_value: numeric('target_value', { precision: 18, scale: 4 }).notNull(),
    current_value: numeric('current_value', { precision: 18, scale: 4 }),
    previous_value: numeric('previous_value', { precision: 18, scale: 4 }),
    warning_threshold: numeric('warning_threshold', { precision: 18, scale: 4 }),
    critical_threshold: numeric('critical_threshold', { precision: 18, scale: 4 }),

    /** Computed status: on_track | at_risk | off_track | not_set */
    status: text('status').notNull().default('not_set'),

    tags: text('tags').array().notNull().default([]),

    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    businessIdx: index('kpis_business_id_idx').on(table.business_id),
    orgIdx: index('kpis_org_id_idx').on(table.org_id),
    statusIdx: index('kpis_status_idx').on(table.status),
  }),
)

// ─────────────────────────────────────────────────────────────────────────────
// BUSINESS RELATIONSHIPS TABLE
// Tracks connections from a business to any other LifeOS entity.
// ─────────────────────────────────────────────────────────────────────────────

export const businessRelationships = pgTable(
  'business_relationships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    business_id: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    org_id: uuid('org_id').notNull(),

    /** The type of related entity: project | knowledge | agent | automation | person | etc. */
    entity_type: text('entity_type').notNull(),
    /** The BIZ/PRJ/AGT/etc. domain key of the related entity */
    entity_key: text('entity_key').notNull(),
    /** Human-readable label for the relationship */
    relationship_label: text('relationship_label').notNull(),

    metadata: jsonb('metadata').default({}),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    created_by: text('created_by').notNull(),
  },
  (table) => ({
    businessIdx: index('business_relationships_business_id_idx').on(table.business_id),
    entityIdx: index('business_relationships_entity_idx').on(
      table.entity_type,
      table.entity_key,
    ),
    uniqRelationship: uniqueIndex('business_relationships_uniq').on(
      table.business_id,
      table.entity_type,
      table.entity_key,
    ),
  }),
)

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT LOG TABLE (append-only)
// ─────────────────────────────────────────────────────────────────────────────

export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    org_id: uuid('org_id').notNull(),
    user_id: text('user_id').notNull(),
    user_email: text('user_email').notNull(),

    action: text('action').notNull(),
    entity_type: text('entity_type').notNull(),
    entity_id: text('entity_id').notNull(),
    entity_title: text('entity_title'),

    before_state: jsonb('before_state'),
    after_state: jsonb('after_state'),
    change_diff: jsonb('change_diff'),

    ip_address: text('ip_address'),
    user_agent: text('user_agent'),
    request_id: text('request_id'),

    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    orgIdx: index('audit_log_org_id_idx').on(table.org_id),
    entityIdx: index('audit_log_entity_idx').on(table.entity_type, table.entity_id),
    userIdx: index('audit_log_user_id_idx').on(table.user_id),
    createdAtIdx: index('audit_log_created_at_idx').on(table.created_at),
    actionIdx: index('audit_log_action_idx').on(table.action),
  }),
)

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY TIMELINE TABLE
// ─────────────────────────────────────────────────────────────────────────────

export const activityTimeline = pgTable(
  'activity_timeline',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    org_id: uuid('org_id').notNull(),

    event_type: text('event_type').notNull(),
    actor_id: text('actor_id').notNull(),
    actor_name: text('actor_name').notNull(),
    actor_avatar: text('actor_avatar'),

    entity_type: text('entity_type').notNull(),
    entity_id: text('entity_id').notNull(),
    entity_title: text('entity_title').notNull(),

    description: text('description').notNull(),
    metadata: jsonb('metadata').default({}),

    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    orgIdx: index('activity_timeline_org_id_idx').on(table.org_id),
    entityIdx: index('activity_timeline_entity_idx').on(table.entity_type, table.entity_id),
    actorIdx: index('activity_timeline_actor_id_idx').on(table.actor_id),
    createdAtIdx: index('activity_timeline_created_at_idx').on(table.created_at),
    eventTypeIdx: index('activity_timeline_event_type_idx').on(table.event_type),
  }),
)

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH SCORES TABLE (computed, cached)
// ─────────────────────────────────────────────────────────────────────────────

export const healthScores = pgTable(
  'health_scores',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    org_id: uuid('org_id').notNull(),
    entity_type: text('entity_type').notNull(),
    entity_id: text('entity_id').notNull(),

    overall_score: integer('overall_score').notNull(),
    label: text('label').notNull(),
    dimensions: jsonb('dimensions').notNull().default([]),
    requires_attention: boolean('requires_attention').notNull().default(false),

    computed_at: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    entityUniq: uniqueIndex('health_scores_entity_uniq').on(table.entity_type, table.entity_id),
    orgIdx: index('health_scores_org_id_idx').on(table.org_id),
  }),
)

// ─────────────────────────────────────────────────────────────────────────────
// RELATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const businessesRelations = relations(businesses, ({ many }) => ({
  versions: many(businessVersions),
  kpis: many(kpis),
  relationships: many(businessRelationships),
}))

export const kpisRelations = relations(kpis, ({ one }) => ({
  business: one(businesses, { fields: [kpis.business_id], references: [businesses.id] }),
}))

export const businessVersionsRelations = relations(businessVersions, ({ one }) => ({
  business: one(businesses, {
    fields: [businessVersions.business_id],
    references: [businesses.id],
  }),
}))

export const businessRelationshipsRelations = relations(businessRelationships, ({ one }) => ({
  business: one(businesses, {
    fields: [businessRelationships.business_id],
    references: [businesses.id],
  }),
}))
