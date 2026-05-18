// One-off script applied during the schema-sync batch to land the
// audit_logs table (0014, partial — FKs skipped due to type mismatch)
// and the FK-drop housekeeping (0015) on the Neon prod DB. Both use
// IF NOT EXISTS / IF EXISTS guards so the script is idempotent.
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

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    // 0014 — audit_logs table (CREATE TABLE only, no FKs).
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
    console.log("✓ 0014 audit_logs table ensured + journaled");

    // 0015 — FK-drop housekeeping. The original 0014 tried to add FKs
    // that Postgres rejected; the schema snapshot still thinks they
    // exist. The DROP IF EXISTS reconciles snapshot ↔ reality.
    await pool.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_clinic_id_clinics_id_fk";`);
    await pool.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_clinician_id_clinicians_id_fk";`);
    await journalMigration(pool, "0015_silly_darkhawk.sql");
    console.log("✓ 0015 FK-drop housekeeping applied + journaled");
  } catch (e) {
    console.error("Failed:", e);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
