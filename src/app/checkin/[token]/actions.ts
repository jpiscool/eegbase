"use server";
import { db } from "@/lib/db";
import { clients, checkIns } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function submitPublicCheckIn(formData: FormData) {
  const token = formData.get("token") as string;
  if (!token) throw new Error("Missing token");

  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.checkInToken, token))
    .limit(1);

  if (!client) throw new Error("Invalid link");

  const get = (key: string) => {
    const v = Number(formData.get(key));
    return isNaN(v) || v === 0 ? null : v;
  };

  const dateStr = (formData.get("date") as string)?.trim();
  const date = dateStr ? new Date(dateStr + "T12:00:00") : new Date();
  const notes = (formData.get("notes") as string)?.trim() || null;

  await db.insert(checkIns).values({
    clientId: client.id,
    date,
    sleepHours: get("sleepHours"),
    sleepQuality: get("sleepQuality") as number,
    mood: get("mood") as number,
    anxiety: get("anxiety") as number,
    focus: get("focus") as number,
    energy: get("energy") as number,
    notes,
  });
}
