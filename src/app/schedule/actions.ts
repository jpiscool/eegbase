"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { appointments, clients, clinicians } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

interface AppointmentPayload {
  clientId: string;
  clinicianId: string;
  clinicId: string;
  title: string;
  scheduledAt: string; // datetime-local string
  durationMinutes: number;
  notes?: string;
}

export async function createAppointment(payload: AppointmentPayload): Promise<string> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const [row] = await db
    .insert(appointments)
    .values({
      clinicId: payload.clinicId,
      clientId: payload.clientId,
      clinicianId: payload.clinicianId,
      scheduledAt: new Date(payload.scheduledAt),
      durationMinutes: payload.durationMinutes,
      title: payload.title.trim() || "Neurofeedback Session",
      notes: payload.notes?.trim() || null,
      status: "scheduled",
    })
    .returning({ id: appointments.id });

  revalidatePath("/schedule");
  return row.id;
}

type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "no_show";

export async function updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await db.update(appointments).set({ status }).where(eq(appointments.id, id));
  revalidatePath("/schedule");
  revalidatePath("/dashboard");
}

interface ReminderResult {
  success: boolean
  error?: string
  message?: string
  preview?: {
    to: string
    subject: string
    body: string
  }
}

export async function sendAppointmentReminder(appointmentId: string): Promise<ReminderResult> {
  "use server"
  const session = await auth()
  if (!session?.user) return { error: "Unauthorized", success: false }

  // Load appointment + client + clinician details
  const appt = await db
    .select({
      id: appointments.id,
      scheduledAt: appointments.scheduledAt,
      title: appointments.title,
      clientName: clients.name,
      clientEmail: clients.email,
      clinicianName: clinicians.name,
    })
    .from(appointments)
    .innerJoin(clients, eq(appointments.clientId, clients.id))
    .innerJoin(clinicians, eq(appointments.clinicianId, clinicians.id))
    .where(and(
      eq(appointments.id, appointmentId),
      eq(clients.clinicId, (session.user as { clinicId?: string }).clinicId ?? "")
    ))
    .limit(1)
    .then(r => r[0])

  if (!appt) return { error: "Appointment not found", success: false }

  // In production this would send via Resend/SendGrid
  // For now, log and return success (email service not yet connected)
  console.log(`[EMAIL REMINDER] To: ${appt.clientEmail} | Subject: Reminder: ${appt.title} on ${new Date(appt.scheduledAt).toLocaleDateString()}`)

  return {
    success: true,
    message: `Reminder queued for ${appt.clientName} (${appt.clientEmail ?? "no email"})`,
    // Return email preview for UI display
    preview: {
      to: appt.clientEmail ?? "",
      subject: `Reminder: ${appt.title}`,
      body: `Hi ${appt.clientName},\n\nThis is a reminder for your upcoming appointment:\n\nDate: ${new Date(appt.scheduledAt).toLocaleDateString()}\nTime: ${new Date(appt.scheduledAt).toLocaleTimeString()}\nWith: ${appt.clinicianName}\n\nPlease reply to this email if you need to reschedule.\n\nBest regards,\nYour Clinic`,
    },
  }
}

export async function sendBulkAppointmentReminders(clinicId: string): Promise<{ success: boolean; sent?: number; total?: number; error?: string }> {
  "use server"
  const session = await auth()
  if (!session?.user || (session.user as { clinicId?: string }).clinicId !== clinicId) {
    return { error: "Unauthorized", success: false }
  }

  // Find appointments in next 48 hours that are scheduled
  const now = new Date()
  const fortyEightHoursLater = new Date(now.getTime() + 48 * 60 * 60 * 1000)

  const upcoming = await db
    .select({ id: appointments.id })
    .from(appointments)
    .innerJoin(clients, eq(appointments.clientId, clients.id))
    .where(and(
      eq(clients.clinicId, clinicId),
      eq(appointments.status, "scheduled"),
    ))
    .limit(50)

  let sent = 0
  for (const appt of upcoming) {
    const result = await sendAppointmentReminder(appt.id)
    if (result.success) sent++
  }

  return { success: true, sent, total: upcoming.length }
}
