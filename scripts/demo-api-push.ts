/**
 * demo-api-push.ts
 *
 * Pushes a full 10-minute simulated Mendi fNIRS session into EEGBase
 * via the REST API — useful for smoke-testing the ingestion endpoint
 * or demoing the integration without a real Mendi device.
 *
 * Run with:
 *   npm run demo:api
 *   — or —
 *   npx tsx scripts/demo-api-push.ts
 *
 * Required env vars (loaded from .env.local via dotenv):
 *   EEGBASE_URL    — base URL of your EEGBase instance (default: http://localhost:3000)
 *   EEGBASE_API_KEY  — your Clinic ID (used as Bearer token)
 *   EEGBASE_CLIENT_ID — UUID of the client to associate the session with
 */

import "dotenv/config";

// ── Configuration ──────────────────────────────────────────────────────────────
const BASE_URL = process.env.EEGBASE_URL ?? "http://localhost:3000";
const API_KEY  = process.env.EEGBASE_API_KEY ?? "";
const CLIENT_ID = process.env.EEGBASE_CLIENT_ID ?? "";

if (!API_KEY || !CLIENT_ID) {
  console.error(
    "\nError: EEGBASE_API_KEY and EEGBASE_CLIENT_ID must be set in .env.local\n" +
    "  EEGBASE_API_KEY=<your-clinic-id>\n" +
    "  EEGBASE_CLIENT_ID=<client-uuid>\n"
  );
  process.exit(1);
}

// ── Signal generation helpers ──────────────────────────────────────────────────

function randWalk(prev: number, min: number, max: number, step = 0.02): number {
  const next = prev + (Math.random() - 0.5) * step;
  return Math.max(min, Math.min(max, next));
}

function round(v: number, places = 3): number {
  return Math.round(v * 10 ** places) / 10 ** places;
}

// ── Sample generation: 10 minutes at 1 sample/sec = 600 samples ───────────────

interface Sample {
  timestampMs: number;
  oxyHbLeft: number;
  oxyHbRight: number;
  deoxyHbLeft: number;
  deoxyHbRight: number;
  rewardScore: number;
}

function generateSamples(durationSeconds: number): Sample[] {
  const samples: Sample[] = [];

  // Initial values (realistic resting-state fNIRS baseline)
  let oxyL   =  0.02;
  let oxyR   =  0.01;
  let deoxyL = -0.01;
  let deoxyR = -0.02;

  for (let t = 0; t < durationSeconds; t++) {
    const progress   = t / durationSeconds;
    const trendRate  = 0.65; // quality factor — simulates a good session
    const trend      = Math.min(progress * trendRate, 0.2);
    const noise      = 0.05;

    oxyL   = randWalk(oxyL   + trend * 0.002,  -0.2,  0.9, noise);
    oxyR   = randWalk(oxyR   + trend * 0.002,  -0.2,  0.9, noise);
    deoxyL = randWalk(deoxyL - trend * 0.001,  -0.5,  0.3, noise * 0.8);
    deoxyR = randWalk(deoxyR - trend * 0.001,  -0.5,  0.3, noise * 0.8);

    const oxyAvg     = (oxyL + oxyR) / 2;
    const rewardScore = round(Math.max(0, Math.min(100, 50 + oxyAvg * 80 + trend * 15)), 1);

    samples.push({
      timestampMs: t * 1000,
      oxyHbLeft:    round(oxyL),
      oxyHbRight:   round(oxyR),
      deoxyHbLeft:  round(deoxyL),
      deoxyHbRight: round(deoxyR),
      rewardScore,
    });
  }

  return samples;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const DURATION_SEC = 600; // 10 minutes
  const startedAt    = new Date().toISOString();

  console.log("\nEEGBase API Demo Push (TypeScript)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Endpoint  : POST ${BASE_URL}/api/v1/sessions`);
  console.log(`Client    : ${CLIENT_ID}`);
  console.log(`Started   : ${startedAt}`);
  console.log(`Duration  : ${DURATION_SEC / 60} minutes`);
  console.log("Generating samples…");

  const samples = generateSamples(DURATION_SEC);
  const avgReward = samples.reduce((s, p) => s + p.rewardScore, 0) / samples.length;

  console.log(`Generated : ${samples.length} samples (avg reward: ${avgReward.toFixed(1)})`);
  console.log("Pushing to API…\n");

  const body = {
    clientId:        CLIENT_ID,
    deviceType:      "mendi",
    startedAt,
    durationSeconds: DURATION_SEC,
    samples,
    preSession:  { focus: 5, mood: 6, anxiety: 5, energy: 6 },
    postSession: {
      focus: 8, mood: 8, anxiety: 3, energy: 7,
      notes: "Session pushed via demo-api-push.ts — 10 min simulated Mendi data.",
    },
    clinicalNotes: "Automated demo session. Demonstrates Mendi fNIRS data ingestion via REST API.",
  };

  const res = await fetch(`${BASE_URL}/api/v1/sessions`, {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json() as { sessionId?: string; error?: string };

  if (res.ok && data.sessionId) {
    console.log("SUCCESS — session created:");
    console.log(`  Session ID : ${data.sessionId}`);
    console.log(`  View at    : ${BASE_URL}/sessions/${data.sessionId}`);
  } else {
    console.error(`FAILED (HTTP ${res.status}):`);
    console.error(`  ${JSON.stringify(data)}`);
    process.exit(1);
  }
}

main().catch((e: unknown) => {
  console.error("\nUnexpected error:", e instanceof Error ? e.message : e);
  process.exit(1);
});
