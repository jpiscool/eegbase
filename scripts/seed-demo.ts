import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/lib/db/schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

// ── Signal generation helpers ─────────────────────────────────────────────────

function randWalk(prev: number, min: number, max: number, step = 0.02): number {
  const next = prev + (Math.random() - 0.5) * step;
  return Math.max(min, Math.min(max, next));
}

function round(v: number, places = 3) {
  return Math.round(v * 10 ** places) / 10 ** places;
}

/**
 * Generate fNIRS + reward data points for a session.
 * quality ∈ [0, 1] — higher = more upward trend (later sessions look better).
 */
async function seedDataPoints(
  sessionId: string,
  durationSec: number,
  quality: number,
  deviceType: "mendi" | "simulator"
) {
  let oxyL = 0.02 + quality * 0.02;
  let oxyR = 0.01 + quality * 0.02;
  let deoxyL = -0.01;
  let deoxyR = -0.02;
  let delta = 0.35, theta = 0.40, alpha = 0.50, beta = 0.30, gamma = 0.15;

  const rows: Array<typeof schema.sessionDataPoints.$inferInsert> = [];

  for (let t = 0; t < durationSec; t++) {
    const progress = t / durationSec;
    const trendRate = quality * 0.08;
    const trend = Math.min(progress * trendRate, quality * 0.2);
    const noise = 0.05;

    oxyL = randWalk(oxyL + trend * 0.002, -0.2, 0.9, noise);
    oxyR = randWalk(oxyR + trend * 0.002, -0.2, 0.9, noise);
    deoxyL = randWalk(deoxyL - trend * 0.001, -0.5, 0.3, noise * 0.8);
    deoxyR = randWalk(deoxyR - trend * 0.001, -0.5, 0.3, noise * 0.8);

    delta = randWalk(delta, 0.1, 0.7, noise);
    theta = randWalk(theta, 0.1, 0.8, noise);
    alpha = randWalk(alpha, 0.1, 0.9, noise * 1.2);
    beta  = randWalk(beta,  0.05, 0.7, noise * 0.9);
    gamma = randWalk(gamma, 0.02, 0.5, noise * 0.7);

    const oxyAvg = (oxyL + oxyR) / 2;
    const rewardScore = round(Math.max(0, Math.min(100, 50 + oxyAvg * 80 + trend * 15)), 1);

    rows.push({
      sessionId,
      timestampMs: t * 1000,
      ...(deviceType !== "simulator"
        ? {
            oxyHbLeft:   round(oxyL),
            oxyHbRight:  round(oxyR),
            deoxyHbLeft: round(deoxyL),
            deoxyHbRight:round(deoxyR),
          }
        : {}),
      delta:  round(delta),
      theta:  round(theta),
      alpha:  round(alpha),
      beta:   round(beta),
      gamma:  round(gamma),
      rewardScore,
    });
  }

  // Insert in 500-row batches
  const BATCH = 500;
  for (let i = 0; i < rows.length; i += BATCH) {
    await db.insert(schema.sessionDataPoints).values(rows.slice(i, i + BATCH));
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const [clinic] = await db.select().from(schema.clinics).limit(1);
  const [clinician] = await db.select().from(schema.clinicians).limit(1);

  if (!clinic || !clinician) {
    console.error("No clinic or clinician found. Run `npm run seed` first to create a base account.");
    process.exit(1);
  }

  const clientData = [
    {
      name: "Sarah Mitchell",
      email: "sarah.m@example.com",
      notes: "ADHD, anxiety. Responds well to shorter morning sessions.",
      goals: "Reduce anxiety, improve sustained attention during work hours",
    },
    {
      name: "Marcus Chen",
      email: "marcus.c@example.com",
      notes: "Post-concussion syndrome. Mild cognitive fatigue and headaches.",
      goals: "Restore baseline cognitive function and reduce fatigue",
    },
    {
      name: "Amara Osei",
      email: "amara.o@example.com",
      notes: "Performance anxiety — professional violinist.",
      goals: "Calm pre-performance nerves and maintain peak cognitive state",
    },
  ];

  const inserted = await db
    .insert(schema.clients)
    .values(clientData.map((c) => ({ ...c, clinicId: clinic.id, clinicianId: clinician.id })))
    .returning();

  const [p1, p2, p3] = await db
    .insert(schema.protocols)
    .values([
      {
        clinicId: clinic.id,
        name: "Prefrontal Upregulation",
        description: "Increase oxyHb in left and right PFC. Evidence-based Mendi protocol for focus and executive function.",
        deviceType: "mendi",
        durationSeconds: 1200,
        parameters: { rewardThreshold: 0.05, smoothingWindow: 8, baselineSeconds: 60, feedbackMode: "visual" },
      },
      {
        clinicId: clinic.id,
        name: "Alpha-Theta Relaxation",
        description: "Deep relaxation and performance anxiety protocol using EEG alpha/theta band regulation.",
        deviceType: "simulator",
        durationSeconds: 1800,
        parameters: { noiseLevel: 0.2, trendStrength: 0.4 },
      },
      {
        clinicId: clinic.id,
        name: "Attention Training (ADHD)",
        description: "Mendi protocol optimised for ADHD — higher reward threshold, responsive feedback.",
        deviceType: "mendi",
        durationSeconds: 1200,
        parameters: { rewardThreshold: 0.06, smoothingWindow: 5, baselineSeconds: 45, feedbackMode: "both" },
      },
    ])
    .returning();

  await db.insert(schema.assignments).values([
    { clientId: inserted[0].id, protocolId: p3.id }, // Sarah → ADHD protocol
    { clientId: inserted[2].id, protocolId: p2.id }, // Amara → Alpha-Theta
  ]);

  console.log("Creating sessions with fNIRS time series…");
  const now = new Date();

  // ── Sarah: 8 sessions trending upward ───────────────────────────────────
  const sarahRewards: number[] = [48.2, 51.7, 54.1, 57.8, 60.3, 63.9, 67.2, 71.5];
  for (let i = 0; i < 8; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - (7 - i) * 3);

    const [savedSession] = await db
      .insert(schema.sessions)
      .values({
        clientId: inserted[0].id,
        protocolId: p3.id,
        deviceType: "mendi",
        startedAt: d,
        endedAt: new Date(d.getTime() + 1200000),
        durationSeconds: 1200,
        avgRewardScore: sarahRewards[i],
        preFocus: Math.max(1, 4 - Math.floor(i * 0.2)) as unknown as number,
        postFocus: Math.min(10, 5 + Math.floor(i * 0.5)) as unknown as number,
        preMood: 5,
        postMood: Math.min(10, 5 + Math.floor(i * 0.3)) as unknown as number,
        preAnxiety: Math.max(1, 7 - Math.floor(i * 0.3)) as unknown as number,
        postAnxiety: Math.max(1, 5 - Math.floor(i * 0.4)) as unknown as number,
        preEnergy: 5,
        postEnergy: Math.min(10, 5 + Math.floor(i * 0.4)) as unknown as number,
        notes: i === 7 ? "Excellent session. Sarah reports significant improvement in daily focus. Consider stepping up threshold." : null,
        postNotes: i === 7 ? "Best session yet — felt the difference throughout the whole day." : null,
      })
      .returning({ id: schema.sessions.id });

    await seedDataPoints(savedSession.id, 1200, i / 7, "mendi");
    process.stdout.write(`  Sarah session ${i + 1}/8 ✓\n`);
  }

  // ── Marcus: 3 sessions ──────────────────────────────────────────────────
  for (let i = 0; i < 3; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - (2 - i) * 5);

    const [savedSession] = await db
      .insert(schema.sessions)
      .values({
        clientId: inserted[1].id,
        deviceType: "simulator",
        startedAt: d,
        endedAt: new Date(d.getTime() + 600000),
        durationSeconds: 600,
        avgRewardScore: 55 + i * 6,
        preFocus: 4, postFocus: 6,
        preMood: 5, postMood: 6,
        preAnxiety: 6, postAnxiety: 5,
        preEnergy: 4, postEnergy: 5,
      })
      .returning({ id: schema.sessions.id });

    await seedDataPoints(savedSession.id, 600, 0.3 + i * 0.2, "simulator");
    process.stdout.write(`  Marcus session ${i + 1}/3 ✓\n`);
  }

  // ── Amara: 5 sessions ───────────────────────────────────────────────────
  for (let i = 0; i < 5; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - (4 - i) * 4);

    const [savedSession] = await db
      .insert(schema.sessions)
      .values({
        clientId: inserted[2].id,
        protocolId: p2.id,
        deviceType: "simulator",
        startedAt: d,
        endedAt: new Date(d.getTime() + 1800000),
        durationSeconds: 1800,
        avgRewardScore: 52 + i * 5,
        preFocus: 6, postFocus: 7,
        preMood: 5, postMood: 7,
        preAnxiety: 8, postAnxiety: Math.max(3, 6 - i),
        preEnergy: 6, postEnergy: 7,
        postNotes: i === 4 ? "Performance was exceptional last week — client attributes it to the training." : null,
      })
      .returning({ id: schema.sessions.id });

    await seedDataPoints(savedSession.id, 1800, 0.2 + i * 0.15, "simulator");
    process.stdout.write(`  Amara session ${i + 1}/5 ✓\n`);
  }

  // ── Check-ins for Sarah (7 days) ─────────────────────────────────────────
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    await db.insert(schema.checkIns).values({
      clientId: inserted[0].id,
      date: d,
      sleepHours: round(6.5 + Math.random() * 1.5, 1),
      sleepQuality: Math.min(10, 5 + Math.floor((6 - i) * 0.4)) as unknown as number,
      mood: Math.min(10, 5 + Math.floor((6 - i) * 0.3)) as unknown as number,
      anxiety: Math.max(2, 7 - Math.floor((6 - i) * 0.6)) as unknown as number,
      focus: Math.min(10, 5 + Math.floor((6 - i) * 0.5)) as unknown as number,
      energy: Math.min(10, 5 + Math.floor((6 - i) * 0.3)) as unknown as number,
    });
  }

  // ── Message thread for Sarah ──────────────────────────────────────────────
  await db.insert(schema.messages).values([
    {
      clientId: inserted[0].id,
      clinicianId: clinician.id,
      senderRole: "clinician",
      body: "Hi Sarah! Great progress this week — your reward scores are trending up nicely. How are you feeling day-to-day?",
    },
    {
      clientId: inserted[0].id,
      clinicianId: clinician.id,
      senderRole: "client",
      body: "Hi! Honestly feeling much better. The morning sessions especially seem to help me stay focused through the workday.",
    },
    {
      clientId: inserted[0].id,
      clinicianId: clinician.id,
      senderRole: "clinician",
      body: "That's exactly what we're aiming for. Let's stick with the morning schedule and step up your reward threshold slightly. See you Thursday!",
    },
  ]);

  console.log("\nDemo data seeded successfully:");
  console.log("  Clients:", inserted.map((c) => c.name).join(", "));
  console.log("  Protocols:", p1.name, "/", p2.name, "/", p3.name);
  console.log("  Sessions: 8 (Sarah) + 3 (Marcus) + 5 (Amara) = 16 total");
  console.log("  Data points: ~22,200 fNIRS/EEG samples with realistic waveforms");

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
