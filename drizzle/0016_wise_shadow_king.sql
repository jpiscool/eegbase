CREATE INDEX IF NOT EXISTS "appointments_clinic_scheduled_idx" ON "appointments" USING btree ("clinic_id","scheduled_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "appointments_client_idx" ON "appointments" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assignments_client_idx" ON "assignments" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assignments_protocol_idx" ON "assignments" USING btree ("protocol_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_clinic_created_idx" ON "audit_logs" USING btree ("clinic_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "clients_clinic_idx" ON "clients" USING btree ("clinic_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "clients_clinic_active_idx" ON "clients" USING btree ("clinic_id","active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_annotations_session_ts_idx" ON "session_annotations" USING btree ("session_id","timestamp_ms");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_data_points_session_ts_idx" ON "session_data_points" USING btree ("session_id","timestamp_ms");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_client_started_idx" ON "sessions" USING btree ("client_id","started_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_protocol_idx" ON "sessions" USING btree ("protocol_id");