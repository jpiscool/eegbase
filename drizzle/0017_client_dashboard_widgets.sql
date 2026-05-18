-- 0017 — per-client dashboard widget layout
-- Each client gets their own widget grid configuration so the clinician
-- can curate a custom dashboard for every person they treat.
ALTER TABLE "clients"
  ADD COLUMN IF NOT EXISTS "dashboard_widgets" text[];
