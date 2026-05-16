-- Add Mendi auxiliary fields to session_data_points.
-- All columns are optional so legacy rows and non-Mendi devices stay NULL.
-- See AUDIT-2026-MENDI-BLE-PROTOCOL.md for the source-of-truth Frame schema.

ALTER TABLE "session_data_points" ADD COLUMN "temperature_c" real;--> statement-breakpoint
ALTER TABLE "session_data_points" ADD COLUMN "accel_mag" real;--> statement-breakpoint
ALTER TABLE "session_data_points" ADD COLUMN "accel_x" real;--> statement-breakpoint
ALTER TABLE "session_data_points" ADD COLUMN "accel_y" real;--> statement-breakpoint
ALTER TABLE "session_data_points" ADD COLUMN "accel_z" real;--> statement-breakpoint
ALTER TABLE "session_data_points" ADD COLUMN "stillness" real;--> statement-breakpoint
ALTER TABLE "session_data_points" ADD COLUMN "pulse_ppg" real;--> statement-breakpoint
ALTER TABLE "session_data_points" ADD COLUMN "pulse_hr_bpm" real;--> statement-breakpoint
ALTER TABLE "session_data_points" ADD COLUMN "pulse_hrv_rmssd" real;--> statement-breakpoint
ALTER TABLE "session_data_points" ADD COLUMN "signal_quality_l" real;--> statement-breakpoint
ALTER TABLE "session_data_points" ADD COLUMN "signal_quality_r" real;--> statement-breakpoint
ALTER TABLE "session_data_points" ADD COLUMN "signal_quality_p" real;--> statement-breakpoint
ALTER TABLE "session_data_points" ADD COLUMN "ambient_level" real;

-- Note: drizzle-kit generate also wanted to CREATE TABLE "audit_logs" plus its
-- two FKs in this migration. That's pre-existing drift between schema.ts and
-- the production DB (audit_logs has never been migrated despite being defined
-- in schema). Splitting it out so this PR stays scoped to the Mendi columns.
-- A follow-up migration (0014) should ship the audit_logs table separately.
