"use server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sessions, clients } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function emailSessionSummary(sessionId: string): Promise<void> {
  const authSession = await auth();
  if (!authSession?.user) throw new Error("Unauthorized");
  const clinicId = (authSession.user as { clinicId?: string }).clinicId!;

  const [row] = await db
    .select({
      clientName: clients.name,
      clientEmail: clients.email,
      startedAt: sessions.startedAt,
      durationSeconds: sessions.durationSeconds,
      avgRewardScore: sessions.avgRewardScore,
    })
    .from(sessions)
    .innerJoin(clients, and(eq(sessions.clientId, clients.id), eq(clients.clinicId, clinicId)))
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!row) throw new Error("Session not found");
  if (!row.clientEmail) throw new Error("Client has no email address on file");

  const date = new Date(row.startedAt).toLocaleDateString("en-US", { dateStyle: "long" });
  const duration = row.durationSeconds != null ? `${Math.round(row.durationSeconds / 60)} min` : "—";
  const reward = row.avgRewardScore != null ? `${row.avgRewardScore.toFixed(1)} / 100` : "—";

  // TODO: integrate Resend (resend.com) or SendGrid here.
  // For now, log the email body so it can be copy-pasted or wired to a provider.
  console.log(`[EMAIL SUMMARY] To: ${row.clientEmail}
Subject: Your neurofeedback session summary – ${date}

Hi ${row.clientName},

Here is a summary of your neurofeedback session on ${date}:
  • Duration: ${duration}
  • Avg reward score: ${reward}

Great work! See you at your next session.

— Your clinic team`);
}
