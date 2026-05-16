import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sessions, clients, protocols, sessionDataPoints } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clinicId = (session.user as { clinicId?: string }).clinicId ?? "";

  const [[row], dataPoints] = await Promise.all([
    db
      .select({ session: sessions, clientName: clients.name, protocolName: protocols.name })
      .from(sessions)
      .innerJoin(clients, and(eq(sessions.clientId, clients.id), eq(clients.clinicId, clinicId)))
      .leftJoin(protocols, eq(sessions.protocolId, protocols.id))
      .where(eq(sessions.id, id))
      .limit(1),
    db
      .select()
      .from(sessionDataPoints)
      .where(eq(sessionDataPoints.sessionId, id))
      .orderBy(asc(sessionDataPoints.timestampMs)),
  ]);

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const s = row.session;
  const payload = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    session: {
      id: s.id,
      client: row.clientName,
      protocol: row.protocolName ?? null,
      device: s.deviceType,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      durationSeconds: s.durationSeconds,
      avgRewardScore: s.avgRewardScore,
      preSession: {
        focus: s.preFocus,
        mood: s.preMood,
        anxiety: s.preAnxiety,
        energy: s.preEnergy,
      },
      postSession: {
        focus: s.postFocus,
        mood: s.postMood,
        anxiety: s.postAnxiety,
        energy: s.postEnergy,
        notes: s.postNotes,
      },
      clinicalNotes: s.notes,
    },
    dataPoints: dataPoints.map((dp) => ({
      timestampMs: dp.timestampMs,
      rewardScore: dp.rewardScore,
      fnirs: {
        oxyHbLeft: dp.oxyHbLeft,
        oxyHbRight: dp.oxyHbRight,
        deoxyHbLeft: dp.deoxyHbLeft,
        deoxyHbRight: dp.deoxyHbRight,
      },
      eeg: {
        delta: dp.delta,
        theta: dp.theta,
        alpha: dp.alpha,
        beta: dp.beta,
        gamma: dp.gamma,
      },
      // Mendi auxiliary fields. All-null for non-Mendi / legacy sessions.
      mendi: {
        temperatureC: dp.temperatureC,
        accelMag: dp.accelMag,
        accelX: dp.accelX,
        accelY: dp.accelY,
        accelZ: dp.accelZ,
        stillness: dp.stillness,
        pulsePpg: dp.pulsePpg,
        pulseHrBpm: dp.pulseHrBpm,
        pulseHrvRmssd: dp.pulseHrvRmssd,
        signalQualityL: dp.signalQualityL,
        signalQualityR: dp.signalQualityR,
        signalQualityP: dp.signalQualityP,
        ambientLevel: dp.ambientLevel,
      },
    })),
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="session-${id.slice(0, 8)}.json"`,
    },
  });
}
