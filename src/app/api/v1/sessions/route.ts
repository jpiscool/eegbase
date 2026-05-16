/**
 * EEGBase REST Ingestion API — POST /api/v1/sessions
 *
 * Allows server-side integrations (e.g. Mendi cloud, research pipelines) to
 * push completed session data into EEGBase without requiring a browser session.
 *
 * Authentication
 * ──────────────
 * Include the clinic's API key (= Clinic ID, visible in Settings → API Access)
 * in the request header:
 *
 *   Authorization: Bearer <clinicId>
 *
 * Request body (application/json)
 * ─────────────────────────────────
 * {
 *   "clientId":       "uuid",          // required — must belong to your clinic
 *   "deviceType":     "mendi",         // "mendi" | "muse" | "simulator"
 *   "startedAt":      "2026-05-02T09:30:00Z",   // ISO 8601
 *   "durationSeconds": 1200,
 *   "samples": [
 *     {
 *       "timestampMs":  0,
 *       "oxyHbLeft":    0.05,    // μM   (fNIRS — Mendi)
 *       "oxyHbRight":   0.04,
 *       "deoxyHbLeft": -0.02,
 *       "deoxyHbRight":-0.03,
 *       "delta":        0.35,    // 0–1  (EEG band powers — Muse)
 *       "theta":        0.40,
 *       "alpha":        0.50,
 *       "beta":         0.30,
 *       "gamma":        0.15,
 *       "rewardScore":  52.3     // 0–100
 *     },
 *     ...
 *   ],
 *   "preSession":  { "focus": 6, "mood": 7, "anxiety": 4, "energy": 7 },  // optional
 *   "postSession": { "focus": 8, "mood": 8, "anxiety": 3, "energy": 6, "notes": "..." },
 *   "clinicalNotes": "..."       // optional free-text clinical notes
 * }
 *
 * Response
 * ────────
 * 201  { "sessionId": "uuid" }
 * 400  { "error": "..." }
 * 401  { "error": "Invalid or missing API key" }
 * 422  { "error": "clientId does not belong to this clinic" }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clinics, clients, sessions, sessionDataPoints } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SampleInput {
  timestampMs: number;
  oxyHbLeft?: number;
  oxyHbRight?: number;
  deoxyHbLeft?: number;
  deoxyHbRight?: number;
  delta?: number;
  theta?: number;
  alpha?: number;
  beta?: number;
  gamma?: number;
  rewardScore?: number;
  // Mendi auxiliary fields (V4 Frame protobuf). All optional.
  temperatureC?: number;
  accelMag?: number;
  accelX?: number;
  accelY?: number;
  accelZ?: number;
  stillness?: number;
  pulsePpg?: number;
  pulseHrBpm?: number;
  pulseHrvRmssd?: number;
  signalQualityL?: number;
  signalQualityR?: number;
  signalQualityP?: number;
  ambientLevel?: number;
}

interface QuestionnaireInput {
  focus?: number;
  mood?: number;
  anxiety?: number;
  energy?: number;
  notes?: string;
}

interface IngestBody {
  clientId: string;
  protocolId?: string;
  deviceType: string;
  startedAt: string;
  durationSeconds?: number;
  samples?: SampleInput[];
  preSession?: QuestionnaireInput;
  postSession?: QuestionnaireInput;
  clinicalNotes?: string;
}

// ── Validation helpers ────────────────────────────────────────────────────────

function isString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isInt1to10(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 10;
}

function validateBody(body: unknown): { valid: true; data: IngestBody } | { valid: false; error: string } {
  if (!body || typeof body !== "object") return { valid: false, error: "Body must be a JSON object" };
  const b = body as Record<string, unknown>;

  if (!isString(b.clientId)) return { valid: false, error: "'clientId' is required (string)" };
  if (!isString(b.deviceType)) return { valid: false, error: "'deviceType' is required (string)" };
  if (!isString(b.startedAt)) return { valid: false, error: "'startedAt' is required (ISO 8601 string)" };
  if (isNaN(Date.parse(b.startedAt as string))) return { valid: false, error: "'startedAt' must be a valid ISO 8601 date" };

  const samples = b.samples;
  if (samples != null && !Array.isArray(samples)) return { valid: false, error: "'samples' must be an array" };
  if (Array.isArray(samples) && samples.length > 50000) return { valid: false, error: "'samples' exceeds maximum length (50,000)" };

  return { valid: true, data: b as unknown as IngestBody };
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── Auth: Bearer = clinicId ──────────────────────────────────────────────
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
  }

  // Validate clinic exists
  const [clinic] = await db
    .select({ id: clinics.id })
    .from(clinics)
    .where(eq(clinics.id, token))
    .limit(1);

  if (!clinic) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
  }
  const clinicId = clinic.id;

  // ── Parse + validate body ────────────────────────────────────────────────
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const validation = validateBody(rawBody);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const body = validation.data;

  // ── Verify client belongs to this clinic ─────────────────────────────────
  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, body.clientId), eq(clients.clinicId, clinicId)))
    .limit(1);

  if (!client) {
    return NextResponse.json({ error: "clientId does not belong to this clinic" }, { status: 422 });
  }

  // ── Compute average reward score ─────────────────────────────────────────
  const samples = body.samples ?? [];
  const rewardValues = samples.map((s) => s.rewardScore).filter((v): v is number => v != null);
  const avgReward =
    rewardValues.length > 0
      ? rewardValues.reduce((a, b) => a + b, 0) / rewardValues.length
      : null;

  // ── Ingest session ───────────────────────────────────────────────────────
  const [saved] = await db
    .insert(sessions)
    .values({
      clientId: client.id,
      protocolId: body.protocolId ?? undefined,
      deviceType: body.deviceType,
      startedAt: new Date(body.startedAt),
      endedAt: new Date(),
      durationSeconds: body.durationSeconds ?? null,
      avgRewardScore: avgReward,
      preFocus:    body.preSession?.focus  != null && isInt1to10(body.preSession.focus)  ? body.preSession.focus  : undefined,
      preMood:     body.preSession?.mood   != null && isInt1to10(body.preSession.mood)   ? body.preSession.mood   : undefined,
      preAnxiety:  body.preSession?.anxiety!= null && isInt1to10(body.preSession.anxiety)? body.preSession.anxiety: undefined,
      preEnergy:   body.preSession?.energy != null && isInt1to10(body.preSession.energy) ? body.preSession.energy : undefined,
      postFocus:   body.postSession?.focus  != null && isInt1to10(body.postSession.focus)  ? body.postSession.focus  : undefined,
      postMood:    body.postSession?.mood   != null && isInt1to10(body.postSession.mood)   ? body.postSession.mood   : undefined,
      postAnxiety: body.postSession?.anxiety!= null && isInt1to10(body.postSession.anxiety)? body.postSession.anxiety: undefined,
      postEnergy:  body.postSession?.energy != null && isInt1to10(body.postSession.energy) ? body.postSession.energy : undefined,
      postNotes:   body.postSession?.notes  ?? undefined,
      notes:       body.clinicalNotes ?? undefined,
    })
    .returning({ id: sessions.id });

  // ── Ingest data points (in batches of 1000) ──────────────────────────────
  if (samples.length > 0) {
    const rows = samples.map((s) => ({
      sessionId: saved.id,
      timestampMs: s.timestampMs,
      oxyHbLeft:   s.oxyHbLeft   ?? undefined,
      oxyHbRight:  s.oxyHbRight  ?? undefined,
      deoxyHbLeft: s.deoxyHbLeft ?? undefined,
      deoxyHbRight:s.deoxyHbRight?? undefined,
      delta:  s.delta  ?? undefined,
      theta:  s.theta  ?? undefined,
      alpha:  s.alpha  ?? undefined,
      beta:   s.beta   ?? undefined,
      gamma:  s.gamma  ?? undefined,
      rewardScore:    s.rewardScore    ?? undefined,
      temperatureC:   s.temperatureC   ?? undefined,
      accelMag:       s.accelMag       ?? undefined,
      accelX:         s.accelX         ?? undefined,
      accelY:         s.accelY         ?? undefined,
      accelZ:         s.accelZ         ?? undefined,
      stillness:      s.stillness      ?? undefined,
      pulsePpg:       s.pulsePpg       ?? undefined,
      pulseHrBpm:     s.pulseHrBpm     ?? undefined,
      pulseHrvRmssd:  s.pulseHrvRmssd  ?? undefined,
      signalQualityL: s.signalQualityL ?? undefined,
      signalQualityR: s.signalQualityR ?? undefined,
      signalQualityP: s.signalQualityP ?? undefined,
      ambientLevel:   s.ambientLevel   ?? undefined,
    }));

    // Insert in 1000-row batches to avoid DB parameter limits
    const BATCH = 1000;
    for (let i = 0; i < rows.length; i += BATCH) {
      await db.insert(sessionDataPoints).values(rows.slice(i, i + BATCH));
    }
  }

  return NextResponse.json({ sessionId: saved.id }, { status: 201 });
}

// Only POST is supported
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: "Method not allowed. Use POST to ingest session data." },
    { status: 405 }
  );
}
