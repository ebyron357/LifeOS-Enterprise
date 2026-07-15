ALTER TABLE "business_relationships" ADD COLUMN "business_key" text NOT NULL;--> statement-breakpoint
ALTER TABLE "kpis" ADD COLUMN "business_key" text NOT NULL;