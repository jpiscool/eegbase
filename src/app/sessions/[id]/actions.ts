"use server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sessions, clients } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Send a session-summary email to the client.
 *
 * Delivery strategy:
 *   1. If RESEND_API_KEY + RESEND_FROM are configured, hit the Resend
 *      REST API directly — no SDK dependency needed.
 *   2. Otherwise fall back to logging the email body to stderr so a
 *      clinician can copy-paste it. This keeps the action functional in
 *      dev / self-hosted deployments without email infrastructure.
 *
 * Resend is the recommended provider because:
 *   • Free tier covers ≥ 3000 emails/month
 *   • Plain REST API — no SDK lock-in
 *   • Supports the `email/messaging` domain reputation expected by
 *     HIPAA-aware clinical workflows (separate clinical-comm domains)
 */
export async function emailSessionSummary(sessionId: string): Promise<{
  delivered: boolean;
  to: string;
  via: "resend" | "log-fallback";
}> {
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

  const subject = `Your neurofeedback session summary – ${date}`;
  const text = `Hi ${row.clientName},

Here is a summary of your neurofeedback session on ${date}:
  • Duration: ${duration}
  • Avg reward score: ${reward}

Great work! See you at your next session.

— Your clinic team`;

  const html = `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;max-width:560px;margin:32px auto;padding:24px;color:#0F172A;line-height:1.55">
  <p>Hi ${escapeHtml(row.clientName)},</p>
  <p>Here is a summary of your neurofeedback session on <strong>${escapeHtml(date)}</strong>:</p>
  <ul style="padding-left:18px">
    <li>Duration: <strong>${escapeHtml(duration)}</strong></li>
    <li>Avg reward score: <strong>${escapeHtml(reward)}</strong></li>
  </ul>
  <p>Great work! See you at your next session.</p>
  <p style="color:#64748B;font-size:13px;margin-top:24px">— Your clinic team</p>
</body></html>`;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  if (apiKey && from) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [row.clientEmail],
        subject,
        text,
        html,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "<no body>");
      throw new Error(`Resend API returned ${res.status}: ${detail.slice(0, 200)}`);
    }

    return { delivered: true, to: row.clientEmail, via: "resend" };
  }

  // Fallback: log the body. The clinician can copy-paste or this can be
  // collected by a server log shipper for ad-hoc delivery.
  console.log(`[EMAIL SUMMARY] To: ${row.clientEmail}
Subject: ${subject}

${text}`);

  return { delivered: false, to: row.clientEmail, via: "log-fallback" };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
