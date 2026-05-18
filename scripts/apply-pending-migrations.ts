// One-off applier for migrations Drizzle's own migrate command refuses
// to ship cleanly (FK type mismatch in 0014, plus hanging migrate runs).
// Each block is idempotent (IF NOT EXISTS / IF EXISTS) so re-running is
// safe.
//
// Usage: DATABASE_URL=... npx tsx scripts/apply-pending-migrations.ts

import { Pool } from "pg";
import "dotenv/config";
import crypto from "crypto";
import fs from "fs";
import path from "path";

async function journalMigration(pool: Pool, file: string) {
  const sql = fs.readFileSync(path.join("drizzle", file), "utf8");
  const hash = crypto.createHash("sha256").update(sql).digest("hex");
  await pool.query(
    "INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [hash, Date.now()],
  );
}

async function applyFile(pool: Pool, file: string) {
  const sql = fs.readFileSync(path.join("drizzle", file), "utf8");
  // Drop the drizzle statement-breakpoint sentinels; Postgres runs
  // the whole script as a multi-statement query.
  const cleaned = sql.replace(/--> statement-breakpoint/g, "");
  await pool.query(cleaned);
}

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    // 0014 — audit_logs CREATE TABLE only.
    await pool.query(`
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
    `);
    await journalMigration(pool, "0014_audit_logs_backfill.sql");
    console.log("✓ 0014 audit_logs (ensured)");

    // 0015 — FK housekeeping.
    await pool.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_clinic_id_clinics_id_fk";`);
    await pool.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_clinician_id_clinicians_id_fk";`);
    await journalMigration(pool, "0015_silly_darkhawk.sql");
    console.log("✓ 0015 FK housekeeping (ensured)");

    // 0016 — 11 indexes for the highest-traffic queries.
    await applyFile(pool, "0016_wise_shadow_king.sql");
    await journalMigration(pool, "0016_wise_shadow_king.sql");
    console.log("✓ 0016 indexes (created)");
  } catch (e) {
    console.error("Failed:", e);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
