"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { checkIns } from "@/lib/db/schema";

export async function logCheckIn(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const clientId = formData.get("clientId") as string;
  if (!clientId) throw new Error("Missing clientId");

  const get = (key: string) => {
    const v = Number(formData.get(key));
    return isNaN(v) ? null : v;
  };

  const dateStr = (formData.get("date") as string)?.trim();
  const date = dateStr ? new Date(dateStr + "T12:00:00") : new Date();

  await db.insert(checkIns).values({
    clientId,
    date,
    sleepHours: get("sleepHours"),
    sleepQuality: get("sleepQuality") as number,
    mood: get("mood") as number,
    anxiety: get("anxiety") as number,
    focus: get("focus") as number,
    energy: get("energy") as number,
    notes: (formData.get("notes") as string).trim() || null,
  });

  revalidatePath(`/clients/${clientId}/checkins`);
}
