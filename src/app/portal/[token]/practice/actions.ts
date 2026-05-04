"use server";

import { db } from "@/lib/db";
import { checkIns, clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function savePracticeResult(
  token: string,
  practice: string,
  durationCompleted: number,
  ratings: { mood: number; energy: number; focus: number },
  notes: string
): Promise<{ success: boolean; error?: string }> {
  // Resolve the client from their check-in token
  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.checkInToken, token))
    .limit(1);

  if (!client) return { success: false, error: "Invalid session token." };

  // Persist as a check-in (reuses existing mood/energy/focus fields)
  await db.insert(checkIns).values({
    clientId: client.id,
    mood: ratings.mood,
    energy: ratings.energy,
    focus: ratings.focus,
    notes: notes
      ? `[Practice: ${practice}, ${durationCompleted}min] ${notes}`
      : `Home practice — ${practice} (${durationCompleted} min)`,
  });

  return { success: true };
}
