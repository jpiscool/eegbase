"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { erpResults, clients } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

interface ErpPayload {
  clientId: string;
  durationSeconds: number;
  totalTrials: number;
  targetCount: number;
  hits: number;
  misses: number;
  falseAlarms: number;
  avgReactionTimeMs: number | null;
  accuracy: number;
  notes?: string;
}

export async function saveErpResult(payload: ErpPayload): Promise<string> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const clinicId = (session.user as { clinicId?: string }).clinicId;

  const [existing] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, payload.clientId), eq(clients.clinicId, clinicId!)))
    .limit(1);

  if (!existing) throw new Error("Client not found");

  const [row] = await db
    .insert(erpResults)
    .values({
      clientId: payload.clientId,
      durationSeconds: payload.durationSeconds,
      totalTrials: payload.totalTrials,
      targetCount: payload.targetCount,
      hits: payload.hits,
      misses: payload.misses,
      falseAlarms: payload.falseAlarms,
      avgReactionTimeMs: payload.avgReactionTimeMs ?? undefined,
      accuracy: payload.accuracy,
      notes: payload.notes ?? null,
    })
    .returning({ id: erpResults.id });

  revalidatePath(`/clients/${payload.clientId}`);
  return row.id;
}
