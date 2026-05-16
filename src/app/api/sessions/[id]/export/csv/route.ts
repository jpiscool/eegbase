/**
 * Per-session per-sample CSV export — GET /api/sessions/[id]/export/csv
 *
 * Researcher-friendly format: one row per data point, columns for every
 * recorded signal channel + reward + HRV. Importable by Python pandas,
 * R, MATLAB, Excel, etc. without any external library.
 *
 * For Mendi sessions specifically the relevant columns are:
 *   timestamp_ms, oxy_hb_left, oxy_hb_right, deoxy_hb_left, deoxy_hb_right, reward_score
 *
 * For Muse / EEG sessions: delta, theta, alpha, beta, gamma, reward_score
 *
 * Authentication
 * ──────────────
 * Requires a valid NextAuth session. Ownership is verified by joining
 * sessions → clients on clinicId.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sessions, clients, sessionDataPoints } from "@/lib/db/schema";
import { and, eq, asc } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";
  if (!clinicId) return new NextResponse("Unauthorized", { status: 401 });

  const { id: sessionId } = await params;

  // Ownership check — joining through clients ensures cross-clinic access is impossible
  const owner = await db
    .select({ id: sessions.id, deviceType: sessions.deviceType })
    .from(sessions)
    .innerJoin(clients, eq(sessions.clientId, clients.id))
    .where(and(eq(sessions.id, sessionId), eq(clients.clinicId, clinicId)))
    .limit(1);

  if (owner.length === 0) return new NextResponse("Not found", { status: 404 });

  const points = await db
    .select({
      timestampMs: sessionDataPoints.timestampMs,
      oxyHbLeft: sessionDataPoints.oxyHbLeft,
      oxyHbRight: sessionDataPoints.oxyHbRight,
      deoxyHbLeft: sessionDataPoints.deoxyHbLeft,
      deoxyHbRight: sessionDataPoints.deoxyHbRight,
      delta: sessionDataPoints.delta,
      theta: sessionDataPoints.theta,
      alpha: sessionDataPoints.alpha,
      beta: sessionDataPoints.beta,
      gamma: sessionDataPoints.gamma,
      rewardScore: sessionDataPoints.rewardScore,
      heartRate: sessionDataPoints.heartRate,
      hrvRmssd: sessionDataPoints.hrvRmssd,
      temperatureC: sessionDataPoints.temperatureC,
      accelMag: sessionDataPoints.accelMag,
      accelX: sessionDataPoints.accelX,
      accelY: sessionDataPoints.accelY,
      accelZ: sessionDataPoints.accelZ,
      stillness: sessionDataPoints.stillness,
      pulsePpg: sessionDataPoints.pulsePpg,
      pulseHrBpm: sessionDataPoints.pulseHrBpm,
      pulseHrvRmssd: sessionDataPoints.pulseHrvRmssd,
      signalQualityL: sessionDataPoints.signalQualityL,
      signalQualityR: sessionDataPoints.signalQualityR,
      signalQualityP: sessionDataPoints.signalQualityP,
      ambientLevel: sessionDataPoints.ambientLevel,
    })
    .from(sessionDataPoints)
    .where(eq(sessionDataPoints.sessionId, sessionId))
    .orderBy(asc(sessionDataPoints.timestampMs));

  const headers = [
    "timestamp_ms",
    "oxy_hb_left",
    "oxy_hb_right",
    "deoxy_hb_left",
    "deoxy_hb_right",
    "delta",
    "theta",
    "alpha",
    "beta",
    "gamma",
    "reward_score",
    "heart_rate_bpm",
    "hrv_rmssd_ms",
    // Mendi auxiliary columns. Empty for non-Mendi / legacy sessions.
    "temperature_c",
    "accel_mag_g",
    "accel_x_g",
    "accel_y_g",
    "accel_z_g",
    "stillness",
    "pulse_ppg",
    "pulse_hr_bpm",
    "pulse_hrv_rmssd_ms",
    "signal_quality_l",
    "signal_quality_r",
    "signal_quality_p",
    "ambient_level",
  ];

  const cell = (v: number | null | undefined): string =>
    v == null || !isFinite(v as number) ? "" : String(v);

  const lines = [headers.join(",")];
  for (const p of points) {
    lines.push(
      [
        p.timestampMs,
        cell(p.oxyHbLeft),
        cell(p.oxyHbRight),
        cell(p.deoxyHbLeft),
        cell(p.deoxyHbRight),
        cell(p.delta),
        cell(p.theta),
        cell(p.alpha),
        cell(p.beta),
        cell(p.gamma),
        cell(p.rewardScore),
        cell(p.heartRate),
        cell(p.hrvRmssd),
        cell(p.temperatureC),
        cell(p.accelMag),
        cell(p.accelX),
        cell(p.accelY),
        cell(p.accelZ),
        cell(p.stillness),
        cell(p.pulsePpg),
        cell(p.pulseHrBpm),
        cell(p.pulseHrvRmssd),
        cell(p.signalQualityL),
        cell(p.signalQualityR),
        cell(p.signalQualityP),
        cell(p.ambientLevel),
      ].join(",")
    );
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="session_${sessionId}_samples.csv"`,
    },
  });
}
