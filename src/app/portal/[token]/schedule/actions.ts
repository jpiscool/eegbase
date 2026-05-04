"use server";

import { db } from "@/lib/db";
import { clients, appointments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function requestAppointment(
  token: string,
  scheduledAt: string,
  title: string,
  notes: string
): Promise<{ success: boolean; error?: string; appointmentId?: string }> {
  // Validate token and find client
  const [client] = await db
    .select({
      id: clients.id,
      clinicId: clients.clinicId,
      clinicianId: clients.clinicianId,
    })
    .from(clients)
    .where(eq(clients.checkInToken, token))
    .limit(1);

  if (!client) {
    return { success: false, error: "Invalid scheduling link." };
  }

  const scheduledDate = new Date(scheduledAt);
  if (isNaN(scheduledDate.getTime())) {
    return { success: false, error: "Invalid date/time selected." };
  }

  if (scheduledDate <= new Date()) {
    return { success: false, error: "Please select a future date and time." };
  }

  const [inserted] = await db
    .insert(appointments)
    .values({
      clinicId: client.clinicId,
      clientId: client.id,
      clinicianId: client.clinicianId,
      scheduledAt: scheduledDate,
      durationMinutes: 60,
      title: title || "Neurofeedback Session",
      notes: notes || null,
      status: "scheduled",
    })
    .returning({ id: appointments.id });

  return { success: true, appointmentId: inserted.id };
}
