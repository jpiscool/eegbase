// ── End-to-end smoke test ───────────────────────────────────────────────────
// Exercises the data-flow pipeline against the LIVE Neon DB using a temp
// clinic. Validates:
//   1. Clinic + admin + default protocols seed
//   2. Client creation
//   3. Session save with synthetic Mendi sample data (MBLL μM values,
//      Mendi aux columns)
//   4. Audit log writes
//   5. Per-block aggregation reads
//   6. Cleanup
//
// Usage: DATABASE_URL=... npx tsx scripts/smoke-test.ts
//
// Exits 0 on success, non-zero on any assertion failure. Suitable for
// CI / pre-deploy gates.

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import * as schema from "../src/lib/db/schema";
import { DEFAULT_PROTOCOL_SEEDS } from "../src/lib/seed/default-protocols";
import { parseProtocolBlocks } from "../src/components/ProtocolBlockTimer";
import "dotenv/config";

const SUITE_TAG = `smoke-${Date.now()}`;
const TEST_EMAIL = `${SUITE_TAG}@smoke-test.local`;
let exitCode = 0;
const fails: string[] = [];

function assert(cond: unknown, label: string) {
  if (cond) console.log(`✓ ${label}`);
  else {
    console.error(`✗ FAIL: ${label}`);
    fails.push(label);
    exitCode = 1;
  }
}

(async () => {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL must be set");
    process.exit(2);
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  let clinicId: string | undefined;
  let clinicianId: string | undefined;
  let clientId: string | undefined;
  let sessionId: string | undefined;
  const protocolIds: string[] = [];

  try {
    console.log(`\n[smoke ${SUITE_TAG}] starting`);

    // 1. Create clinic + admin + seed protocols (mirrors registerClinicAction).
    const [clinic] = await db
      .insert(schema.clinics)
      .values({ name: `[SMOKE] ${SUITE_TAG}` })
      .returning({ id: schema.clinics.id });
    clinicId = clinic.id;
    assert(!!clinicId, "clinic created");

    const passwordHash = await bcrypt.hash("smoke-test-password", 4);
    const [admin] = await db
      .insert(schema.clinicians)
      .values({
        clinicId: clinic.id,
        name: "Smoke Admin",
        email: TEST_EMAIL,
        passwordHash,
        role: "admin",
      })
      .returning({ id: schema.clinicians.id });
    clinicianId = admin.id;
    assert(!!clinicianId, "admin clinician created");

    // Seed default protocols (mirrors the register action).
    const inserted = await db
      .insert(schema.protocols)
      .values(
        DEFAULT_PROTOCOL_SEEDS.map((p) => ({
          clinicId: clinic.id,
          name: p.name,
          description: p.description,
          deviceType: p.deviceType,
          durationSeconds: p.durationSeconds,
          parameters: p.parameters,
        })),
      )
      .returning({ id: schema.protocols.id, name: schema.protocols.name, parameters: schema.protocols.parameters });
    for (const p of inserted) protocolIds.push(p.id);
    assert(inserted.length === DEFAULT_PROTOCOL_SEEDS.length, `seeded ${DEFAULT_PROTOCOL_SEEDS.length} protocols`);

    // Verify the seeded protocols have parseable blocks that sum to duration.
    let blockMismatch = 0;
    for (const p of inserted) {
      const blocks = parseProtocolBlocks(p.parameters);
      const expected = DEFAULT_PROTOCOL_SEEDS.find((s) => s.name === p.name);
      const sum = blocks.reduce((a, b) => a + b.durationSeconds, 0);
      if (expected && sum !== expected.durationSeconds) blockMismatch++;
    }
    assert(blockMismatch === 0, "every seeded protocol's blocks sum to its durationSeconds");

    // 2. Create a test client.
    const [client] = await db
      .insert(schema.clients)
      .values({
        clinicId: clinic.id,
        clinicianId: admin.id,
        name: "Smoke Test Client",
        email: `${SUITE_TAG}-client@smoke-test.local`,
      })
      .returning({ id: schema.clients.id });
    clientId = client.id;
    assert(!!clientId, "client created");

    // 3. Save a session with synthetic Mendi sample data.
    // Picks the fNIRS Attention Training protocol (has 6 blocks).
    const protocol = inserted.find((p) => p.name.includes("Attention"));
    if (!protocol) throw new Error("attention protocol missing");
    const blocks = parseProtocolBlocks(protocol.parameters);
    const totalSec = blocks.reduce((a, b) => a + b.durationSeconds, 0);

    const [savedSession] = await db
      .insert(schema.sessions)
      .values({
        clientId: client.id,
        protocolId: protocol.id,
        deviceType: "mendi",
        startedAt: new Date(),
        endedAt: new Date(Date.now() + totalSec * 1000),
        durationSeconds: totalSec,
        avgRewardScore: 65,
        preFocus: 6,
        preMood: 7,
        preAnxiety: 4,
        preEnergy: 6,
      })
      .returning({ id: schema.sessions.id });
    sessionId = savedSession.id;
    assert(!!sessionId, "session created");

    // Synthetic samples — one per second across the session. Test the
    // NEW Mendi aux columns from migration 0013 (which we just landed).
    const samples = [];
    for (let s = 0; s < totalSec; s++) {
      // Walk reward through a plausible curve; HbO in clinical μM range.
      const t = s / totalSec;
      const reward = 45 + 25 * Math.sin(t * Math.PI) + (Math.random() - 0.5) * 5;
      const hboL = 1.5 + 2.5 * Math.sin(t * Math.PI * 2) + (Math.random() - 0.5) * 0.3;
      const hboR = 1.4 + 2.4 * Math.sin(t * Math.PI * 2 + 0.2) + (Math.random() - 0.5) * 0.3;
      samples.push({
        sessionId: savedSession.id,
        timestampMs: s * 1000,
        oxyHbLeft: hboL,
        oxyHbRight: hboR,
        deoxyHbLeft: -hboL * 0.3,
        deoxyHbRight: -hboR * 0.3,
        rewardScore: Math.max(0, Math.min(100, reward)),
        temperatureC: 32 + Math.random() * 0.5,
        accelMag: 1.0 + (Math.random() - 0.5) * 0.02,
        accelX: 0.02 + (Math.random() - 0.5) * 0.01,
        accelY: 0.05 + (Math.random() - 0.5) * 0.01,
        accelZ: 0.998 + (Math.random() - 0.5) * 0.005,
        stillness: 95 + Math.random() * 5,
        pulsePpg: Math.sin(s * 1.2) * 1000,
        pulseHrBpm: 68 + Math.sin(t * Math.PI) * 4,
        pulseHrvRmssd: 45 + Math.sin(t * Math.PI * 3) * 8,
        signalQualityL: 65 + Math.random() * 5,
        signalQualityR: 67 + Math.random() * 5,
        signalQualityP: 70 + Math.random() * 5,
        ambientLevel: 10 + Math.random() * 3,
      });
    }
    const BATCH = 1000;
    for (let i = 0; i < samples.length; i += BATCH) {
      await db.insert(schema.sessionDataPoints).values(samples.slice(i, i + BATCH));
    }
    assert(samples.length === totalSec, `${samples.length} data points inserted`);

    // 4. Verify the data made it AND the new Mendi columns are populated.
    const readBack = await db
      .select({
        oxyHbLeft: schema.sessionDataPoints.oxyHbLeft,
        temperatureC: schema.sessionDataPoints.temperatureC,
        pulseHrBpm: schema.sessionDataPoints.pulseHrBpm,
        signalQualityL: schema.sessionDataPoints.signalQualityL,
        ambientLevel: schema.sessionDataPoints.ambientLevel,
      })
      .from(schema.sessionDataPoints)
      .where(eq(schema.sessionDataPoints.sessionId, savedSession.id))
      .limit(10);
    assert(readBack.length === 10, "data points readable");
    assert(readBack.every((r) => r.oxyHbLeft !== null), "oxyHbLeft populated");
    assert(readBack.every((r) => r.temperatureC !== null), "temperatureC populated (migration 0013)");
    assert(readBack.every((r) => r.pulseHrBpm !== null), "pulseHrBpm populated (migration 0013)");
    assert(readBack.every((r) => r.signalQualityL !== null), "signalQualityL populated (migration 0013)");
    assert(readBack.every((r) => r.ambientLevel !== null), "ambientLevel populated (migration 0013)");

    // HbO values are in clinically plausible μM range.
    const oxyValues = readBack.map((r) => r.oxyHbLeft as number);
    const maxAbs = Math.max(...oxyValues.map(Math.abs));
    assert(maxAbs < 50, `HbO magnitudes in clinical range (max |HbO|=${maxAbs.toFixed(2)} μM)`);

    // 5. Audit-log smoke — write a session.created event the way the
    // saveSession action does, then read it back.
    const [auditRow] = await db
      .insert(schema.auditLogs)
      .values({
        clinicId: clinic.id,
        clinicianId: admin.id,
        clinicianName: "Smoke Admin",
        action: "session.created",
        resourceType: "session",
        resourceId: savedSession.id,
        resourceLabel: "Smoke Test Client",
      })
      .returning({ id: schema.auditLogs.id });
    assert(!!auditRow?.id, "audit_logs accepts an insert (migration 0014)");

    const auditRead = await db
      .select()
      .from(schema.auditLogs)
      .where(and(eq(schema.auditLogs.clinicId, clinic.id), eq(schema.auditLogs.action, "session.created")))
      .limit(1);
    assert(auditRead.length === 1, "audit event readable");

    // 6. Per-block aggregation — reproduces the math from
    // /sessions/[id]/report. Each block's data-point bucket should be
    // non-empty and yield a sensible avgReward.
    const dataPoints = await db
      .select({
        timestampMs: schema.sessionDataPoints.timestampMs,
        rewardScore: schema.sessionDataPoints.rewardScore,
      })
      .from(schema.sessionDataPoints)
      .where(eq(schema.sessionDataPoints.sessionId, savedSession.id));
    let cum = 0;
    let allBucketsNonEmpty = true;
    for (const b of blocks) {
      const lo = cum * 1000;
      const hi = (cum + b.durationSeconds) * 1000;
      const pts = dataPoints.filter((p) => p.timestampMs >= lo && p.timestampMs < hi);
      if (pts.length === 0) { allBucketsNonEmpty = false; break; }
      cum += b.durationSeconds;
    }
    assert(allBucketsNonEmpty, `all ${blocks.length} protocol blocks have ≥1 data point`);

  } catch (e) {
    console.error("Unexpected error:", e);
    exitCode = 1;
  } finally {
    // 7. Cleanup — drop everything we created so the prod DB stays clean.
    console.log("\n[smoke] cleaning up");
    try {
      if (sessionId) {
        await pool.query("DELETE FROM session_data_points WHERE session_id = $1", [sessionId]);
        await pool.query("DELETE FROM sessions WHERE id = $1", [sessionId]);
      }
      if (clientId) await pool.query("DELETE FROM clients WHERE id = $1", [clientId]);
      if (protocolIds.length > 0) {
        await pool.query("DELETE FROM protocols WHERE id = ANY($1)", [protocolIds]);
      }
      if (clinicianId) await pool.query("DELETE FROM clinicians WHERE id = $1", [clinicianId]);
      if (clinicId) {
        await pool.query("DELETE FROM audit_logs WHERE clinic_id = $1", [clinicId]);
        await pool.query("DELETE FROM clinics WHERE id = $1", [clinicId]);
      }
      console.log("✓ cleanup complete");
    } catch (e) {
      console.error("cleanup partial failure:", e);
    }
    await pool.end();
  }

  if (exitCode === 0) {
    console.log(`\n✓ smoke test passed`);
  } else {
    console.log(`\n✗ smoke test FAILED (${fails.length} assertions)`);
    for (const f of fails) console.log(`  - ${f}`);
  }
  process.exit(exitCode);
})();
