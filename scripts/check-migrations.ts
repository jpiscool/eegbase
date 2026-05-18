import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import 'dotenv/config';

// Inspects the Neon prod DB for migration state + schema presence.
// Read-only — never writes. Run with:
//   DATABASE_URL=... npx tsx scripts/check-migrations.ts

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  const applied = await db.execute(
    "SELECT hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at DESC LIMIT 20" as never,
  );
  const rows = (applied as unknown as { rows: { hash: string; created_at: number }[] }).rows;
  console.log(`Applied migrations: ${rows.length}`);

  const cols = await db.execute(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'session_data_points' AND column_name IN ('temperature_c','accel_mag','accel_x','accel_y','accel_z','pulse_ppg','pulse_hr_bpm','pulse_hrv_rmssd','signal_quality_l','signal_quality_r','signal_quality_p','ambient_level','stillness')" as never,
  );
  const colRows = (cols as unknown as { rows: { column_name: string }[] }).rows;
  console.log(`\nMendi aux cols on session_data_points present: ${colRows.length}/13`);
  for (const r of colRows) console.log(`  ✓ ${r.column_name}`);

  const tables = await db.execute(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='audit_logs'" as never,
  );
  const tRows = (tables as unknown as { rows: { table_name: string }[] }).rows;
  console.log(`\naudit_logs table exists: ${tRows.length > 0 ? "YES" : "NO"}`);

  await pool.end();
})();
