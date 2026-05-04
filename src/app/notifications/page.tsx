import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clients, messages, appointments, checkIns, consumables } from "@/lib/db/schema";
import { eq, and, isNull, gte, lte, desc, count } from "drizzle-orm";
import Link from "next/link";
import {
  Bell, MessageSquare, CalendarDays, ClipboardCheck,
  Package, CheckCircle2, ArrowRight,
} from "lucide-react";

export default async function NotificationsPage() {
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const [
    unreadMessages,
    todayAppointments,
    recentCheckIns,
    lowStockItems,
  ] = await Promise.all([
    // Unread messages from clients
    db
      .select({
        id: messages.id,
        clientId: messages.clientId,
        clientName: clients.name,
        body: messages.body,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .innerJoin(clients, and(eq(messages.clientId, clients.id), eq(clients.clinicId, clinicId)))
      .where(and(eq(messages.senderRole, "client"), isNull(messages.readAt)))
      .orderBy(desc(messages.createdAt))
      .limit(10),

    // Appointments today + tomorrow
    db
      .select({
        id: appointments.id,
        scheduledAt: appointments.scheduledAt,
        durationMinutes: appointments.durationMinutes,
        title: appointments.title,
        clientId: appointments.clientId,
        clientName: clients.name,
        status: appointments.status,
      })
      .from(appointments)
      .innerJoin(clients, eq(appointments.clientId, clients.id))
      .where(
        and(
          eq(appointments.clinicId, clinicId),
          eq(appointments.status, "scheduled"),
          gte(appointments.scheduledAt, now),
          lte(appointments.scheduledAt, tomorrow)
        )
      )
      .orderBy(appointments.scheduledAt)
      .limit(10),

    // Recent check-ins (last 48h)
    db
      .select({
        id: checkIns.id,
        clientId: checkIns.clientId,
        clientName: clients.name,
        date: checkIns.date,
        mood: checkIns.mood,
        focus: checkIns.focus,
        anxiety: checkIns.anxiety,
      })
      .from(checkIns)
      .innerJoin(clients, and(eq(checkIns.clientId, clients.id), eq(clients.clinicId, clinicId)))
      .where(gte(checkIns.date, fortyEightHoursAgo))
      .orderBy(desc(checkIns.date))
      .limit(8),

    // Low stock consumables
    db
      .select({ id: consumables.id, name: consumables.name, currentStock: consumables.currentStock, parLevel: consumables.parLevel, unit: consumables.unit })
      .from(consumables)
      .where(eq(consumables.clinicId, clinicId)),
  ]);

  const lowStock = lowStockItems.filter((c) => c.currentStock != null && c.parLevel != null && c.currentStock <= c.parLevel);

  const totalCount = unreadMessages.length + todayAppointments.length + recentCheckIns.length + lowStock.length;

  function timeAgo(d: Date) {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  function apptTime(d: Date) {
    const dt = new Date(d);
    const isToday = dt.toDateString() === now.toDateString();
    const timePart = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    return isToday ? `Today at ${timePart}` : `Tomorrow at ${timePart}`;
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: totalCount > 0 ? "var(--brand-subtle)" : "var(--surface-sunken)" }}
        >
          <Bell size={18} style={{ color: totalCount > 0 ? "var(--brand)" : "var(--text-tertiary)" }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Notifications</h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            {totalCount === 0 ? "All caught up" : `${totalCount} item${totalCount !== 1 ? "s" : ""} need attention`}
          </p>
        </div>
      </div>

      {totalCount === 0 && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <CheckCircle2 size={22} style={{ color: "var(--success)" }} />
            </div>
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>You&apos;re all caught up!</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
              No unread messages, upcoming appointments, or alerts right now.
            </p>
          </div>
        </div>
      )}

      {/* Unread messages */}
      {unreadMessages.length > 0 && (
        <Section icon={<MessageSquare size={15} />} title="Unread Messages" count={unreadMessages.length} color="var(--brand)">
          {unreadMessages.map((msg, i) => (
            <NotifRow
              key={msg.id}
              href={`/clients/${msg.clientId}/messages`}
              first={i === 0}
              accent="var(--brand)"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{msg.clientName}</p>
                <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-secondary)" }}>{msg.body}</p>
              </div>
              <span className="text-xs shrink-0" style={{ color: "var(--text-tertiary)" }}>{timeAgo(msg.createdAt)}</span>
            </NotifRow>
          ))}
          <div className="px-5 py-3" style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--surface-sunken)" }}>
            <Link href="/messages" className="text-xs font-semibold" style={{ color: "var(--brand)" }}>
              Open Messages →
            </Link>
          </div>
        </Section>
      )}

      {/* Upcoming appointments */}
      {todayAppointments.length > 0 && (
        <Section icon={<CalendarDays size={15} />} title="Upcoming Appointments" count={todayAppointments.length} color="var(--success)">
          {todayAppointments.map((appt, i) => (
            <NotifRow
              key={appt.id}
              href={`/clients/${appt.clientId}`}
              first={i === 0}
              accent="var(--success)"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{appt.title}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                  {appt.clientName} · {appt.durationMinutes}min
                </p>
              </div>
              <span className="text-xs font-medium shrink-0" style={{ color: "var(--success)" }}>{apptTime(appt.scheduledAt)}</span>
            </NotifRow>
          ))}
          <div className="px-5 py-3" style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--surface-sunken)" }}>
            <Link href="/schedule" className="text-xs font-semibold" style={{ color: "var(--brand)" }}>
              View Schedule →
            </Link>
          </div>
        </Section>
      )}

      {/* Recent check-ins */}
      {recentCheckIns.length > 0 && (
        <Section icon={<ClipboardCheck size={15} />} title="Recent Check-Ins" count={recentCheckIns.length} color="var(--info)">
          {recentCheckIns.map((ci, i) => (
            <NotifRow
              key={ci.id}
              href={`/clients/${ci.clientId}/checkins`}
              first={i === 0}
              accent="var(--info)"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{ci.clientName}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                  Mood {ci.mood ?? "—"} · Focus {ci.focus ?? "—"} · Anxiety {ci.anxiety ?? "—"}
                </p>
              </div>
              <span className="text-xs shrink-0" style={{ color: "var(--text-tertiary)" }}>{timeAgo(ci.date)}</span>
            </NotifRow>
          ))}
          <div className="px-5 py-3" style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--surface-sunken)" }}>
            <Link href="/clients" className="text-xs font-semibold" style={{ color: "var(--brand)" }}>
              View Clients →
            </Link>
          </div>
        </Section>
      )}

      {/* Low stock */}
      {lowStock.length > 0 && (
        <Section icon={<Package size={15} />} title="Low Inventory" count={lowStock.length} color="var(--warning)">
          {lowStock.map((item, i) => (
            <NotifRow
              key={item.id}
              href="/settings/inventory"
              first={i === 0}
              accent="var(--warning)"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{item.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                  {item.currentStock} {item.unit} remaining (par: {item.parLevel})
                </p>
              </div>
              <span className="text-xs font-semibold shrink-0 status-pill status-pill-warning">Low</span>
            </NotifRow>
          ))}
          <div className="px-5 py-3" style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--surface-sunken)" }}>
            <Link href="/settings/inventory" className="text-xs font-semibold" style={{ color: "var(--brand)" }}>
              Manage Inventory →
            </Link>
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({
  icon, title, count, color, children,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card overflow-hidden mb-5">
      <div
        className="flex items-center gap-2 px-5 py-3.5"
        style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--surface-sunken)" }}
      >
        <span style={{ color }}>{icon}</span>
        <h2 className="text-sm font-semibold flex-1" style={{ color: "var(--text-primary)" }}>{title}</h2>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: color, color: "white" }}
        >
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}

function NotifRow({
  href, first, accent, children,
}: {
  href: string;
  first: boolean;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 px-5 py-3.5 transition-colors"
      style={{
        borderTop: !first ? "1px solid var(--border-subtle)" : undefined,
        borderLeft: `3px solid ${accent}`,
      }}
    >
      {children}
      <ArrowRight size={14} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
    </Link>
  );
}
