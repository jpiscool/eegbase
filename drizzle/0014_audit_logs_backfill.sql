-- Backfill the audit_logs table. It's been in src/lib/db/schema.ts for a
-- while but had never been emitted into a Drizzle migration file. The 0013
-- migration captured it into the snapshot (so future `drizzle-kit generate`
-- runs no longer see drift) but did not ship the SQL — split out here so the
-- table actually exists in environments that built from migrations alone.
--
-- Wrapped in IF NOT EXISTS guards so this is safe to apply whether or not
-- the table is already present in production (e.g. from a prior
-- `drizzle-kit push` that bypassed the migration history).

CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" text PRIMARY KEY NOT NULL,
    "clinic_id" text NOT NULL,
    "clinician_id" text,
    "clinician_name" text,
    "action" text NOT NULL,
    "resource_type" text,
    "resource_id" text,
    "resource_label" text,
    "ip_address" text,
    "user_agent" text,
    "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'audit_logs_clinic_id_clinics_id_fk'
    ) THEN
        ALTER TABLE "audit_logs"
            ADD CONSTRAINT "audit_logs_clinic_id_clinics_id_fk"
            FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id")
            ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'audit_logs_clinician_id_clinicians_id_fk'
    ) THEN
        ALTER TABLE "audit_logs"
            ADD CONSTRAINT "audit_logs_clinician_id_clinicians_id_fk"
            FOREIGN KEY ("clinician_id") REFERENCES "public"."clinicians"("id")
            ON DELETE set null ON UPDATE no action;
    END IF;
END $$;
