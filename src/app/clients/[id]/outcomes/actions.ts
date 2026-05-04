"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { outcomeMeasures, clients } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export interface OutcomePayload {
  clientId: string;
  measureType: string;
  answers: Record<string, number>;
  totalScore: number;
  interpretation: string;
  notes?: string;
}

export async function saveOutcomeMeasure(payload: OutcomePayload): Promise<string> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const clinicId = (session.user as { clinicId?: string }).clinicId!;

  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, payload.clientId), eq(clients.clinicId, clinicId)))
    .limit(1);
  if (!client) throw new Error("Client not found");

  const [row] = await db
    .insert(outcomeMeasures)
    .values({
      clientId: payload.clientId,
      measureType: payload.measureType,
      answers: payload.answers,
      totalScore: payload.totalScore,
      interpretation: payload.interpretation,
      notes: payload.notes ?? null,
    })
    .returning({ id: outcomeMeasures.id });

  revalidatePath(`/clients/${payload.clientId}`);
  revalidatePath(`/clients/${payload.clientId}/outcomes`);
  return row.id;
}
