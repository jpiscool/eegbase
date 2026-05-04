"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { soapNotes, sessions, clients } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * markSessionReviewed: insert an empty soap note to remove the session from
 * the review queue (the queue filters out sessions that already have a soap note).
 */
export async function markSessionReviewed(
  sessionId: string
): Promise<{ success: boolean; error?: string }> {
  const authSession = await auth();
  if (!authSession?.user) {
    return { success: false, error: "Not authenticated." };
  }

  const clinicId = (authSession.user as { clinicId?: string })?.clinicId ?? "";

  // Verify the session belongs to this clinic
  const [row] = await db
    .select({ sessionId: sessions.id })
    .from(sessions)
    .innerJoin(
      clients,
      and(eq(sessions.clientId, clients.id), eq(clients.clinicId, clinicId))
    )
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!row) {
    return { success: false, error: "Session not found or access denied." };
  }

  // Upsert an empty soap note (marks the session as reviewed)
  await db
    .insert(soapNotes)
    .values({
      sessionId,
      subjective: null,
      objective: null,
      assessment: null,
      plan: null,
    })
    .onConflictDoNothing();

  return { success: true };
}
