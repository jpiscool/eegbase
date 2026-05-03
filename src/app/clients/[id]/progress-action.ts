"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clients, sessions, checkIns } from "@/lib/db/schema";
import { eq, and, desc, avg } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";

export async function generateClientProgressSummary(clientId: string): Promise<string> {
  const userSession = await auth();
  if (!userSession?.user) throw new Error("Unauthorized");

  const clinicId = (userSession.user as { clinicId?: string }).clinicId;
  if (!clinicId) throw new Error("No clinic");

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured. Add it to .env.local to enable AI insights."
    );
  }

  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.clinicId, clinicId)))
    .limit(1);

  if (!client) throw new Error("Client not found");

  const [sessionList, recentCheckIns, [avgRow]] = await Promise.all([
    db
      .select({
        startedAt: sessions.startedAt,
        durationSeconds: sessions.durationSeconds,
        avgRewardScore: sessions.avgRewardScore,
        deviceType: sessions.deviceType,
        preFocus: sessions.preFocus,
        postFocus: sessions.postFocus,
        preMood: sessions.preMood,
        postMood: sessions.postMood,
        preAnxiety: sessions.preAnxiety,
        postAnxiety: sessions.postAnxiety,
        preEnergy: sessions.preEnergy,
        postEnergy: sessions.postEnergy,
        notes: sessions.notes,
        aiSummary: sessions.aiSummary,
      })
      .from(sessions)
      .where(eq(sessions.clientId, clientId))
      .orderBy(desc(sessions.startedAt))
      .limit(20),
    db
      .select()
      .from(checkIns)
      .where(eq(checkIns.clientId, clientId))
      .orderBy(desc(checkIns.date))
      .limit(14),
    db
      .select({ avgScore: avg(sessions.avgRewardScore) })
      .from(sessions)
      .where(eq(sessions.clientId, clientId)),
  ]);

  if (sessionList.length === 0) {
    throw new Error("No sessions recorded yet — complete at least one session first.");
  }

  const overall = avgRow?.avgScore ? Number(avgRow.avgScore).toFixed(1) : "n/a";

  // Trend: first half vs second half
  const half = Math.floor(sessionList.length / 2);
  const recentHalf = sessionList.slice(0, Math.max(1, half));
  const olderHalf = sessionList.slice(half);
  const recentAvg = recentHalf
    .filter((s) => s.avgRewardScore != null)
    .map((s) => s.avgRewardScore!)
    .reduce((a, b) => a + b, 0) / (recentHalf.filter((s) => s.avgRewardScore != null).length || 1);
  const olderAvg = olderHalf
    .filter((s) => s.avgRewardScore != null)
    .map((s) => s.avgRewardScore!)
    .reduce((a, b) => a + b, 0) / (olderHalf.filter((s) => s.avgRewardScore != null).length || 1);

  const sessionSummaries = sessionList
    .slice(0, 10)
    .map((s, i) => {
      const d = new Date(s.startedAt).toLocaleDateString();
      const score = s.avgRewardScore != null ? s.avgRewardScore.toFixed(1) : "n/a";
      const focusDelta =
        s.preFocus != null && s.postFocus != null ? ` focus ${s.preFocus}→${s.postFocus}` : "";
      const moodDelta =
        s.preMood != null && s.postMood != null ? ` mood ${s.preMood}→${s.postMood}` : "";
      return `Session ${sessionList.length - i} (${d}): reward ${score}/100${focusDelta}${moodDelta}`;
    })
    .join("\n");

  const checkInSummary = recentCheckIns.length > 0
    ? recentCheckIns
        .slice(0, 7)
        .map((c) => {
          const d = new Date(c.date).toLocaleDateString();
          const parts = [
            c.mood != null ? `mood ${c.mood}` : null,
            c.focus != null ? `focus ${c.focus}` : null,
            c.anxiety != null ? `anxiety ${c.anxiety}` : null,
            c.sleepHours != null ? `sleep ${c.sleepHours}h` : null,
          ].filter(Boolean);
          return `${d}: ${parts.join(", ")}`;
        })
        .join("\n")
    : "No check-in data available.";

  const prompt = `You are a senior neurofeedback clinician writing a longitudinal progress summary for a clinical record. Write 4–6 sentences of plain professional text (no markdown, no bullet points, no headers). Cover: overall trajectory based on reward score trends, notable questionnaire patterns (focus/mood/anxiety), what the data suggests about clinical progress toward the client's stated goals, and one specific recommendation for the next phase of training.

CLIENT OVERVIEW:
- Name: ${client.name}
- Goals: ${client.goals ?? "not documented"}
- Notes: ${client.notes ?? "none"}
- Total sessions: ${sessionList.length}
- Devices used: ${[...new Set(sessionList.map((s) => s.deviceType))].join(", ")}
- Overall avg reward score: ${overall} / 100
- Trend: first-half avg ${olderAvg.toFixed(1)} → recent-half avg ${recentAvg.toFixed(1)} (${recentAvg > olderAvg ? "improving" : recentAvg < olderAvg ? "declining" : "stable"})

MOST RECENT SESSIONS (latest first):
${sessionSummaries}

RECENT DAILY CHECK-INS (latest first):
${checkInSummary}`;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  });

  const summary =
    message.content[0].type === "text" ? message.content[0].text.trim() : "";

  await db
    .update(clients)
    .set({ aiSummary: summary, aiSummaryUpdatedAt: new Date() })
    .where(eq(clients.id, clientId));

  revalidatePath(`/clients/${clientId}`);
  return summary;
}
