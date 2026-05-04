"use server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sessions, clients, sessionAnnotations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function addAnnotation(
  sessionId: string,
  data: { label: string; category: string; timestampMs: number }
) {
  const authSession = await auth();
  const clinicId = (authSession?.user as { clinicId?: string })?.clinicId ?? "";

  // Verify ownership: session must belong to a client of this clinic
  const [row] = await db
    .select({ id: sessions.id })
    .from(sessions)
    .innerJoin(clients, and(eq(sessions.clientId, clients.id), eq(clients.clinicId, clinicId)))
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!row) throw new Error("Session not found");

  await db.insert(sessionAnnotations).values({
    sessionId,
    label: data.label,
    category: data.category,
    timestampMs: data.timestampMs,
  });

  revalidatePath(`/sessions/${sessionId}`);
}

export async function deleteAnnotation(sessionId: string, annotationId: string) {
  const authSession = await auth();
  const clinicId = (authSession?.user as { clinicId?: string })?.clinicId ?? "";

  const [row] = await db
    .select({ id: sessions.id })
    .from(sessions)
    .innerJoin(clients, and(eq(sessions.clientId, clients.id), eq(clients.clinicId, clinicId)))
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!row) throw new Error("Session not found");

  await db.delete(sessionAnnotations).where(
    and(eq(sessionAnnotations.id, annotationId), eq(sessionAnnotations.sessionId, sessionId))
  );

  revalidatePath(`/sessions/${sessionId}`);
}
