"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sessions, sessionDataPoints, clients } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export interface SamplePayload {
  timestampMs: number;
  oxyHbLeft?: number;
  oxyHbRight?: number;
  deoxyHbLeft?: number;
  deoxyHbRight?: number;
  theta?: number;
  alpha?: number;
  beta?: number;
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
        theta: s.theta,
        alpha: s.alpha,
        beta: s.beta,
        rewardScore: s.rewardScore,
      }))
    );
  }

  return saved.id;
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
