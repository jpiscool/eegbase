-- Drop the FK constraints that the schema snapshot expects but never
-- actually got applied (Postgres refused the original 0014 ADD CONSTRAINT
-- because audit_logs.clinic_id is text while clinics.id is uuid).
-- IF EXISTS guards so this is safe to apply even when the constraint is
-- already absent — which is the case in production today.
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_clinic_id_clinics_id_fk";
--> statement-breakpoint
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_clinician_id_clinicians_id_fk";
