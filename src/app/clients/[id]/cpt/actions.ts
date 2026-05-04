"use server";
import { db } from "@/lib/db";
import { cptResults } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";

export async function saveCptResult(data: {
  clientId: string;
  durationSeconds: number;
  totalStimuli: number;
  targetCount: number;
  hits: number;
  misses: number;
  falseAlarms: number;
  avgReactionTimeMs: number | null;
  accuracy: number;
  notes?: string;
}): Promise<{ id: string }> {
  const [row] = await db.insert(cptResults).values({
    clientId: data.clientId,
    durationSeconds: data.durationSeconds,
    totalStimuli: data.totalStimuli,
    targetCount: data.targetCount,
    hits: data.hits,
    misses: data.misses,
    falseAlarms: data.falseAlarms,
    avgReactionTimeMs: data.avgReactionTimeMs ?? null,
    accuracy: data.accuracy,
    notes: data.notes ?? null,
  }).returning({ id: cptResults.id });
  revalidatePath(`/clients/${data.clientId}`);
  return { id: row.id };
}
