import { db } from "@/lib/db";
import { clients, appointments, clinics } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { ScheduleCalendar } from "./ScheduleCalendar";

export default async function PortalSchedulePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Look up client by checkInToken
  const [client] = await db
    .select({
      id: clients.id,
      name: clients.name,
      clinicId: clients.clinicId,
      clinicianId: clients.clinicianId,
    })
    .from(clients)
    .where(eq(clients.checkInToken, token))
    .limit(1);

  if (!client) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F8FAFC",
          padding: 24,
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: 16,
            padding: "48px 40px",
            maxWidth: 400,
            width: "100%",
            textAlign: "center",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔗</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>
            Invalid Link
          </h1>
          <p style={{ fontSize: 14, color: "#64748B" }}>
            This scheduling link is invalid or has expired. Please contact your clinician for a new link.
          </p>
        </div>
      </div>
    );
  }

  // Load clinic info
  const [clinic] = await db
    .select({ name: clinics.name })
    .from(clinics)
    .where(eq(clinics.id, client.clinicId))
    .limit(1);

  // Load existing appointments in the next 30 days for this clinic
  const now = new Date();
  const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const existingAppointments = await db
    .select({
      scheduledAt: appointments.scheduledAt,
      clinicianId: appointments.clinicianId,
      durationMinutes: appointments.durationMinutes,
    })
    .from(appointments)
    .where(
      and(
        eq(appointments.clinicId, client.clinicId),
        eq(appointments.status, "scheduled"),
        gte(appointments.scheduledAt, now),
        lte(appointments.scheduledAt, thirtyDaysOut)
      )
    );

  // Serialize for client component
  const bookedSlots = existingAppointments.map((a) => ({
    scheduledAt: a.scheduledAt.toISOString(),
    clinicianId: a.clinicianId,
    durationMinutes: a.durationMinutes,
  }));

  return (
    <ScheduleCalendar
      token={token}
      clientName={client.name}
      clinicName={clinic?.name ?? "Your Clinic"}
      clinicianId={client.clinicianId}
      bookedSlots={bookedSlots}
    />
  );
}
