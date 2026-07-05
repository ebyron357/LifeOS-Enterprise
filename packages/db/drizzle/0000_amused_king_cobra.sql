CREATE TABLE IF NOT EXISTS "activity_timeline" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"actor_id" text NOT NULL,
	"actor_name" text NOT NULL,
	"actor_avatar" text,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"entity_title" text NOT NULL,
	"description" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"user_email" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"entity_title" text,
	"before_state" jsonb,
	"after_state" jsonb,
	"change_diff" jsonb,
	"ip_address" text,
	"user_agent" text,
	"request_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "business_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_key" text NOT NULL,
	"relationship_label" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "business_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"changed_by" text NOT NULL,
	"change_summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "businesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_key" text NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"status" text DEFAULT 'Pre-Launch' NOT NULL,
	"model" text,
	"industry" text,
	"founded" text,
	"website" text,
	"github_org" text,
	"description" text,
	"owner_id" text NOT NULL,
	"ai_owner_id" text,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"archived_by" text,
	"archive_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "businesses_business_key_unique" UNIQUE("business_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "health_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"overall_score" integer NOT NULL,
	"label" text NOT NULL,
	"dimensions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"requires_attention" boolean DEFAULT false NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kpis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"unit" text NOT NULL,
	"direction" text DEFAULT 'higher_is_better' NOT NULL,
	"measurement_period" text DEFAULT 'monthly' NOT NULL,
	"target_value" numeric(18, 4) NOT NULL,
	"current_value" numeric(18, 4),
	"previous_value" numeric(18, 4),
	"warning_threshold" numeric(18, 4),
	"critical_threshold" numeric(18, 4),
	"status" text DEFAULT 'not_set' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "business_relationships" ADD CONSTRAINT "business_relationships_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "business_versions" ADD CONSTRAINT "business_versions_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kpis" ADD CONSTRAINT "kpis_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_timeline_org_id_idx" ON "activity_timeline" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_timeline_entity_idx" ON "activity_timeline" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_timeline_actor_id_idx" ON "activity_timeline" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_timeline_created_at_idx" ON "activity_timeline" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_timeline_event_type_idx" ON "activity_timeline" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_log_org_id_idx" ON "audit_log" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_log_entity_idx" ON "audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_log_user_id_idx" ON "audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_log_action_idx" ON "audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "business_relationships_business_id_idx" ON "business_relationships" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "business_relationships_entity_idx" ON "business_relationships" USING btree ("entity_type","entity_key");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "business_relationships_uniq" ON "business_relationships" USING btree ("business_id","entity_type","entity_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "business_versions_business_id_idx" ON "business_versions" USING btree ("business_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "business_versions_version_uniq" ON "business_versions" USING btree ("business_id","version");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "businesses_org_id_idx" ON "businesses" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "businesses_status_idx" ON "businesses" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "businesses_slug_org_uniq" ON "businesses" USING btree ("slug","org_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "businesses_archived_idx" ON "businesses" USING btree ("archived");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "businesses_tags_idx" ON "businesses" USING btree ("tags");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "health_scores_entity_uniq" ON "health_scores" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "health_scores_org_id_idx" ON "health_scores" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kpis_business_id_idx" ON "kpis" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kpis_org_id_idx" ON "kpis" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kpis_status_idx" ON "kpis" USING btree ("status");