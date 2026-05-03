"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sessions, sessionDataPoints, clients, protocols } from "@/lib/db/schema";
import { eq, and, avg } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";

export async function generateSessionInsight(sessionId: string): Promise<string> {
  const userSession = await auth();
  if (!userSession?.user) throw new Error("Unauthorized");

  const clinicId = (userSession.user as { clinicId?: string }).clinicId;
  if (!clinicId) throw new Error("No clinic");

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  // Verify ownership and fetch session details
  const [s] = await db
    .select({
      id: sessions.id,
      deviceType: sessions.deviceType,
      durationSeconds: sessions.durationSeconds,
      avgRewardScore: sessions.avgRewardScore,
      preFocus: sessions.preFocus,
      postFocus: sessions.postFocus,
      preMood: sessions.preMood,
      postMood: sessions.postMood,
      preAnxiety: sessions.preAnxiety,
      postAnxiety: sessions.postAnxiety,
      preEnergy: sessions.preEnergy,
      postEnergy: sessions.postEnergy,
      notes: sessions.notes,
      postNotes: sessions.postNotes,
      clientName: clients.name,
      clientGoals: clients.goals,
      clientNotes: clients.notes,
      startedAt: sessions.startedAt,
    })
    .from(sessions)
    .innerJoin(clients, and(eq(sessions.clientId, clients.id), eq(clients.clinicId, clinicId)))
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!s) throw new Error("Session not found");

  // Compute signal averages from data points
  const [signalAvgs] = await db
    .select({
      avgOxyL: avg(sessionDataPoints.oxyHbLeft),
      avgOxyR: avg(sessionDataPoints.oxyHbRight),
      avgDeoxyL: avg(sessionDataPoints.deoxyHbLeft),
      avgDeoxyR: avg(sessionDataPoints.deoxyHbRight),
      avgDelta: avg(sessionDataPoints.delta),
      avgTheta: avg(sessionDataPoints.theta),
      avgAlpha: avg(sessionDataPoints.alpha),
      avgBeta: avg(sessionDataPoints.beta),
      avgGamma: avg(sessionDataPoints.gamma),
    })
    .from(sessionDataPoints)
    .where(eq(sessionDataPoints.sessionId, sessionId));

  const fmt = (v: string | null, places = 3) =>
    v != null ? Number(v).toFixed(places) : "n/a";

  const durationMin = s.durationSeconds
    ? Math.round(s.durationSeconds / 60)
    : null;

  const questDelta = (pre: number | null, post: number | null) => {
    if (pre == null || post == null) return "n/a";
    const d = post - pre;
    return `${pre}→${post} (${d >= 0 ? "+" : ""}${d})`;
  };

  const prompt = `You are an experienced neurofeedback clinician reviewing a completed training session. Provide a concise, professional clinical insight note in plain text (no markdown, no bullet points, no headings) — 3 to 5 sentences. Focus on what the data shows about the client's neurophysiological response, whether the session was effective, and one concrete recommendation for the next session.

SESSION DATA:
- Client: ${s.clientName}
- Goals: ${s.clientGoals ?? "not specified"}
- Clinical notes: ${s.clientNotes ?? "none"}
- Device: ${s.deviceType} | Duration: ${durationMin != null ? durationMin + " min" : "unknown"}
- Session date: ${new Date(s.startedAt).toLocaleDateString()}
- Average reward score: ${s.avgRewardScore != null ? s.avgRewardScore.toFixed(1) + " / 100" : "n/a"}

QUESTIONNAIRE (1–10 scale):
- Focus: ${questDelta(s.preFocus, s.postFocus)}
- Mood: ${questDelta(s.preMood, s.postMood)}
- Anxiety: ${questDelta(s.preAnxiety, s.postAnxiety)}
- Energy: ${questDelta(s.preEnergy, s.postEnergy)}

SIGNAL AVERAGES:
${s.deviceType !== "simulator" ? `- OxyHb Left: ${fmt(signalAvgs?.avgOxyL ?? null)} μM
- OxyHb Right: ${fmt(signalAvgs?.avgOxyR ?? null)} μM
- DeoxyHb Left: ${fmt(signalAvgs?.avgDeoxyL ?? null)} μM
- DeoxyHb Right: ${fmt(signalAvgs?.avgDeoxyR ?? null)} μM
` : ""}- Delta: ${fmt(signalAvgs?.avgDelta ?? null)}
- Theta: ${fmt(signalAvgs?.avgTheta ?? null)}
- Alpha: ${fmt(signalAvgs?.avgAlpha ?? null)}
- Beta: ${fmt(signalAvgs?.avgBeta ?? null)}
- Gamma: ${fmt(signalAvgs?.avgGamma ?? null)}

CLIENT POST-SESSION NOTE: ${s.postNotes ?? "none"}
CLINICIAN NOTE: ${s.notes ?? "none"}`;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    messages: [{ role: "user", content: prompt }],
  });

  const aiSummary =
    message.content[0].type === "text" ? message.content[0].text.trim() : "";

  // Persist to DB
  await db
    .update(sessions)
    .set({ aiSummary })
    .where(eq(sessions.id, sessionId));

  revalidatePath(`/sessions/${sessionId}`);
  return aiSummary;
}
