import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { appointments, clients } from "@/lib/db/schema";
import { eq, and, gte } from "drizzle-orm";
import Link from "next/link";
import { CalendarDays, Clock, User } from "lucide-react";
import { NewAppointmentModal } from "@/components/NewAppointmentModal";
import { AppointmentStatusBtn } from "@/components/AppointmentStatusBtn";
import { SendReminderBtn } from "@/components/SendReminderBtn";

export default async function SchedulePage() {
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";
  const clinicianId = session?.user?.id ?? "";

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const rows = await db
    .select({
      id: appointments.id,
      scheduledAt: appointments.scheduledAt,
      durationMinutes: appointments.durationMinutes,
      title: appointments.title,
      notes: appointments.notes,
      status: appointments.status,
      clientId: appointments.clientId,
      clientName: clients.name,
      clientEmail: clients.email,
    })
    .from(appointments)
    .innerJoin(clients, eq(appointments.clientId, clients.id))
    .where(and(eq(appointments.clinicId, clinicId), gte(appointments.scheduledAt, thirtyDaysAgo)))
    .orderBy(appointments.scheduledAt);

  const upcoming = rows.filter((r) => new Date(r.scheduledAt) >= now);
  const past = rows.filter((r) => new Date(r.scheduledAt) < now).reverse();

  const clientList = await db
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .where(and(eq(clients.clinicId, clinicId), eq(clients.active, true)))
    .orderBy(clients.name);

  function statusStyle(status: string): React.CSSProperties {
    const map: Record<string, React.CSSProperties> = {
      scheduled: { background: "color-mix(in srgb, var(--brand) 10%, transparent)", color: "var(--brand)" },
      completed: { background: "var(--success-subtle)", color: "var(--success)" },
      cancelled: { background: "var(--surface-sunken)", color: "var(--text-tertiary)" },
      no_show: { background: "var(--danger-subtle)", color: "var(--danger)" },
    };
    return map[status] ?? { background: "var(--surface-sunken)", color: "var(--text-secondary)" };
  }

  function fmtTime(d: Date | string) {
    return new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  }

  function fmtDate(d: Date | string) {
    const dt = new Date(d);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (dt.toDateString() === today.toDateString()) return "Today";
    if (dt.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <CalendarDays size={22} style={{ color: "var(--brand)" }} />
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Schedule</h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Upcoming appointments and session bookings</p>
          </div>
        </div>
        <NewAppointmentModal clients={clientList} clinicianId={clinicianId} clinicId={clinicId} />
      </div>

      {/* Upcoming */}
      <div className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--text-tertiary)" }}>
          Upcoming ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <div className="rounded-xl border border-dashed py-12 text-center text-sm" style={{ borderColor: "var(--border-default)", color: "var(--text-tertiary)" }}>
            No upcoming appointments scheduled.
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((appt) => (
              <div key={appt.id} className="rounded-xl border px-5 py-4 flex items-center gap-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
                {/* Date block */}
                <div className="w-14 shrink-0 text-center">
                  <p className="text-xs font-semibold uppercase" style={{ color: "var(--brand)" }}>
                    {new Date(appt.scheduledAt).toLocaleDateString("en-US", { month: "short" })}
                  </p>
                  <p className="text-2xl font-bold tabular-nums leading-none" style={{ color: "var(--text-primary)" }}>
                    {new Date(appt.scheduledAt).getDate()}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {new Date(appt.scheduledAt).toLocaleDateString("en-US", { weekday: "short" })}
                  </p>
                </div>

                <div className="w-px h-12 shrink-0" style={{ background: "var(--border-subtle)" }} />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{appt.title}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                      <User size={11} />
                      <Link href={`/clients/${appt.clientId}`} className="hover:underline" style={{ color: "var(--text-secondary)" }}>
                        {appt.clientName}
                      </Link>
                    </span>
                    <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
                      <Clock size={11} />
                      {fmtDate(appt.scheduledAt)} · {fmtTime(appt.scheduledAt)} · {appt.durationMinutes} min
                    </span>
                  </div>
                  {appt.notes && (
                    <p className="text-xs mt-1 truncate" style={{ color: "var(--text-tertiary)" }}>{appt.notes}</p>
                  )}
                </div>

                <SendReminderBtn appointmentId={appt.id} clientEmail={appt.clientEmail} />
                <AppointmentStatusBtn id={appt.id} status={appt.status as "scheduled" | "completed" | "cancelled" | "no_show"} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent / Past */}
      {past.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--text-tertiary)" }}>
            Recent (last 30 days)
          </h2>
          <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
            <table className="w-full text-sm">
              <thead className="border-b" style={{ background: "var(--surface-sunken)", borderColor: "var(--border-subtle)" }}>
                <tr>
                  {["Date & Time", "Client", "Title", "Duration", "Status"].map((h) => (
                    <th key={h} className="text-left px-6 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                {past.map((appt) => (
                  <tr key={appt.id}>
                    <td className="px-6 py-3 whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>
                      {new Date(appt.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {fmtTime(appt.scheduledAt)}
                    </td>
                    <td className="px-6 py-3">
                      <Link href={`/clients/${appt.clientId}`} className="hover:underline" style={{ color: "var(--brand)" }}>
                        {appt.clientName}
                      </Link>
                    </td>
                    <td className="px-6 py-3" style={{ color: "var(--text-primary)" }}>{appt.title}</td>
                    <td className="px-6 py-3" style={{ color: "var(--text-secondary)" }}>{appt.durationMinutes} min</td>
                    <td className="px-6 py-3">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full capitalize" style={statusStyle(appt.status)}>
                        {appt.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
