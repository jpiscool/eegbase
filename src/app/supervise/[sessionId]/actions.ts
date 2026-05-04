"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sessionDataPoints, sessions, clients } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function getLatestSessionData(sessionId: string) {
  const authSession = await auth();
  if (!authSession?.user) return null;

  const clinicId = (authSession.user as { clinicId?: string })?.clinicId ?? "";
  if (!clinicId) return null;

  // Verify session belongs to this clinic before returning any data
  const [row] = await db
    .select({ id: sessions.id })
    .from(sessions)
    .innerJoin(clients, and(eq(sessions.clientId, clients.id), eq(clients.clinicId, clinicId)))
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!row) return null;

  // Get last 60 datapoints
  const points = await db
    .select()
    .from(sessionDataPoints)
    .where(eq(sessionDataPoints.sessionId, sessionId))
    .orderBy(desc(sessionDataPoints.timestampMs))
    .limit(60);

  return points.reverse();
}
