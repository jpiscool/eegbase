"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sessions, sessionDataPoints, clients, clinics, clinicians } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

async function fireWebhook(
  webhookUrl: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "EEGBase/1.0" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    // Fire-and-forget — don't surface webhook errors to the client
  }
}

export interface SamplePayload {
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
}

export interface Questionnaire {
  focus: number;
  mood: number;
  anxiety: number;
  energy: number;
}

export async function saveSession(data: {
  clientId: string;
  protocolId: string | null;
  deviceType: string;
  startedAt: string;
  durationSeconds: number;
  samples: SamplePayload[];
  preSession?: Questionnaire;
  postSession?: Questionnaire & { notes?: string };
  clinicalNotes?: string;
}): Promise<string> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const rewardScores = data.samples
    .map((s) => s.rewardScore)
    .filter((v): v is number => v != null);
  const avgReward =
    rewardScores.length > 0
      ? rewardScores.reduce((a, b) => a + b, 0) / rewardScores.length
      : null;

  const [saved] = await db
    .insert(sessions)
    .values({
      clientId: data.clientId,
      protocolId: data.protocolId ?? undefined,
      deviceType: data.deviceType,
      startedAt: new Date(data.startedAt),
      endedAt: new Date(),
      durationSeconds: data.durationSeconds,
      avgRewardScore: avgReward,
      preFocus: data.preSession?.focus,
      preMood: data.preSession?.mood,
      preAnxiety: data.preSession?.anxiety,
      preEnergy: data.preSession?.energy,
      postFocus: data.postSession?.focus,
      postMood: data.postSession?.mood,
      postAnxiety: data.postSession?.anxiety,
      postEnergy: data.postSession?.energy,
      notes: data.clinicalNotes || undefined,
      postNotes: data.postSession?.notes,
    })
    .returning({ id: sessions.id });

  if (data.samples.length > 0) {
    await db.insert(sessionDataPoints).values(
      data.samples.map((s) => ({
        sessionId: saved.id,
        timestampMs: s.timestampMs,
        oxyHbLeft: s.oxyHbLeft,
        oxyHbRight: s.oxyHbRight,
        deoxyHbLeft: s.deoxyHbLeft,
        deoxyHbRight: s.deoxyHbRight,
        delta: s.delta,
        theta: s.theta,
        alpha: s.alpha,
        beta: s.beta,
        gamma: s.gamma,
        rewardScore: s.rewardScore,
      }))
    );
  }

  // Fire webhook (fire-and-forget)
  const clinicId = (session.user as { clinicId?: string }).clinicId;
  if (clinicId) {
    const [clinic] = await db.select({ webhookUrl: clinics.webhookUrl }).from(clinics).where(eq(clinics.id, clinicId)).limit(1);
    if (clinic?.webhookUrl) {
      const [clientRow] = await db.select({ name: clients.name }).from(clients).where(eq(clients.id, data.clientId)).limit(1);
      const [clinician] = await db.select({ name: clinicians.name }).from(clinicians).where(eq(clinicians.id, session.user.id!)).limit(1);
      void fireWebhook(clinic.webhookUrl, {
        event: "session.saved",
        sessionId: saved.id,
        clientName: clientRow?.name ?? null,
        clinicianName: clinician?.name ?? null,
        deviceType: data.deviceType,
        startedAt: data.startedAt,
        durationSeconds: data.durationSeconds,
        avgRewardScore: avgReward,
        sampleCount: data.samples.length,
        preSession: data.preSession ?? null,
        postSession: data.postSession ?? null,
        timestamp: new Date().toISOString(),
      });
    }
  }

  return saved.id;
}

export async function deleteSession(sessionId: string): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const clinicId = (session.user as { clinicId?: string }).clinicId;
  if (!clinicId) throw new Error("No clinic");

  const [existing] = await db
    .select({ id: sessions.id })
    .from(sessions)
    .innerJoin(clients, and(eq(sessions.clientId, clients.id), eq(clients.clinicId, clinicId)))
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!existing) throw new Error("Not found");

  await db.delete(sessionDataPoints).where(eq(sessionDataPoints.sessionId, sessionId));
  await db.delete(sessions).where(eq(sessions.id, sessionId));

  revalidatePath("/sessions");
}

export async function updateSessionNotes(sessionId: string, notes: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const clinicId = (session.user as { clinicId?: string }).clinicId;
  if (!clinicId) throw new Error("No clinic");

  // Verify ownership via clients join
  const [existing] = await db
    .select({ id: sessions.id })
    .from(sessions)
    .innerJoin(clients, and(eq(sessions.clientId, clients.id), eq(clients.clinicId, clinicId)))
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!existing) throw new Error("Not found");

  await db
    .update(sessions)
    .set({ notes: notes.trim() || null })
    .where(eq(sessions.id, sessionId));

  revalidatePath(`/sessions/${sessionId}`);
}
