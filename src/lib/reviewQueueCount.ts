import { db } from "@/lib/db";
import { sessions, clients, soapNotes } from "@/lib/db/schema";
import { eq, and, lt, inArray } from "drizzle-orm";

/**
 * Returns the number of sessions for a clinic that ended more than 1 hour ago
 * and do not yet have a SOAP note (i.e., are awaiting clinical documentation).
 */
export async function getReviewQueueCount(clinicId: string): Promise<number> {
  if (!clinicId) return 0;

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const pendingSessions = await db
    .select({ id: sessions.id })
    .from(sessions)
    .innerJoin(clients, and(eq(sessions.clientId, clients.id), eq(clients.clinicId, clinicId)))
    .where(lt(sessions.endedAt, oneHourAgo));

  if (pendingSessions.length === 0) return 0;

  const pendingIds = pendingSessions.map((s) => s.id);
  const reviewed = await db
    .select({ sessionId: soapNotes.sessionId })
    .from(soapNotes)
    .where(inArray(soapNotes.sessionId, pendingIds));

  const reviewedSet = new Set(reviewed.map((n) => n.sessionId));
  return pendingIds.filter((id) => !reviewedSet.has(id)).length;
}
