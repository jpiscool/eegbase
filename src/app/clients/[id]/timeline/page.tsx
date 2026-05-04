import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import {
  clients, sessions, checkIns, cptResults, erpResults,
  goals, messages, invoices, appointments,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Activity, ClipboardList, Brain, BarChart2,
  Target, MessageSquare, Receipt, CalendarDays, CheckCircle,
} from "lucide-react";

type TimelineEvent = {
  date: Date;
  type: string;
  label: string;
  detail?: string;
  href?: string;
  iconColor: string;
  iconBg: string;
  iconBorder: string;
  icon: React.ComponentType<{ size?: number }>;
};

export default async function ClientTimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";

  const [client] = await db
    .select({ id: clients.id, name: clients.name, clinicId: clients.clinicId })
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.clinicId, clinicId)))
    .limit(1);
  if (!client) notFound();

  const [
    sessionList, checkInList, cptList, erpList,
    goalList, messageList, invoiceList, appointmentList,
  ] = await Promise.all([
    db.select({ id: sessions.id, startedAt: sessions.startedAt, avgRewardScore: sessions.avgRewardScore, deviceType: sessions.deviceType })
      .from(sessions).where(eq(sessions.clientId, id)).orderBy(desc(sessions.startedAt)),
    db.select({ id: checkIns.id, date: checkIns.date, mood: checkIns.mood, focus: checkIns.focus })
      .from(checkIns).where(eq(checkIns.clientId, id)).orderBy(desc(checkIns.date)),
    db.select({ id: cptResults.id, administeredAt: cptResults.administeredAt, accuracy: cptResults.accuracy })
      .from(cptResults).where(eq(cptResults.clientId, id)).orderBy(desc(cptResults.administeredAt)),
    db.select({ id: erpResults.id, administeredAt: erpResults.administeredAt, accuracy: erpResults.accuracy })
      .from(erpResults).where(eq(erpResults.clientId, id)).orderBy(desc(erpResults.administeredAt)),
    db.select({ id: goals.id, title: goals.title, status: goals.status, completedAt: goals.completedAt, createdAt: goals.createdAt })
      .from(goals).where(eq(goals.clientId, id)).orderBy(desc(goals.createdAt)),
    db.select({ id: messages.id, body: messages.body, senderRole: messages.senderRole, createdAt: messages.createdAt })
      .from(messages).where(eq(messages.clientId, id)).orderBy(desc(messages.createdAt)),
    db.select({ id: invoices.id, description: invoices.description, amountCents: invoices.amountCents, status: invoices.status, issuedAt: invoices.issuedAt })
      .from(invoices).where(eq(invoices.clientId, id)).orderBy(desc(invoices.issuedAt)),
    db.select({ id: appointments.id, title: appointments.title, scheduledAt: appointments.scheduledAt, status: appointments.status })
      .from(appointments).where(eq(appointments.clientId, id)).orderBy(desc(appointments.scheduledAt)),
  ]);

  const events: TimelineEvent[] = [
    ...sessionList.map((s) => ({
      date: new Date(s.startedAt),
      type: "session",
      label: "Neurofeedback Session",
      detail: s.avgRewardScore != null ? `Avg reward: ${s.avgRewardScore.toFixed(1)} · ${s.deviceType}` : s.deviceType,
      href: `/sessions/${s.id}`,
      iconColor: "var(--brand)",
      iconBg: "color-mix(in srgb, var(--brand) 12%, transparent)",
      iconBorder: "color-mix(in srgb, var(--brand) 25%, transparent)",
      icon: Activity,
    })),
    ...checkInList.map((c) => ({
      date: new Date(c.date),
      type: "checkin",
      label: "Daily Check-In",
      detail: [c.mood != null && `Mood: ${c.mood}`, c.focus != null && `Focus: ${c.focus}`].filter(Boolean).join(" · ") || undefined,
      iconColor: "var(--success)",
      iconBg: "var(--success-subtle)",
      iconBorder: "color-mix(in srgb, var(--success) 25%, transparent)",
      icon: ClipboardList,
    })),
    ...cptList.map((c) => ({
      date: new Date(c.administeredAt),
      type: "cpt",
      label: "CPT Assessment",
      detail: `Accuracy: ${(c.accuracy * 100).toFixed(1)}%`,
      href: `/clients/${id}/cpt`,
      iconColor: "#7C3AED",
      iconBg: "color-mix(in srgb, #7C3AED 12%, transparent)",
      iconBorder: "color-mix(in srgb, #7C3AED 25%, transparent)",
      icon: Brain,
    })),
    ...erpList.map((e) => ({
      date: new Date(e.administeredAt),
      type: "erp",
      label: "ERP/P300 Assessment",
      detail: `Accuracy: ${(e.accuracy * 100).toFixed(1)}%`,
      iconColor: "#4338CA",
      iconBg: "color-mix(in srgb, #4338CA 12%, transparent)",
      iconBorder: "color-mix(in srgb, #4338CA 25%, transparent)",
      icon: BarChart2,
    })),
    ...goalList.map((g) => ({
      date: new Date(g.completedAt ?? g.createdAt),
      type: "goal",
      label: g.completedAt ? "Goal Achieved" : "Goal Created",
      detail: g.title,
      href: `/clients/${id}/goals`,
      iconColor: g.completedAt ? "var(--warning)" : "var(--text-tertiary)",
      iconBg: g.completedAt ? "var(--warning-subtle)" : "var(--surface-sunken)",
      iconBorder: g.completedAt ? "color-mix(in srgb, var(--warning) 25%, transparent)" : "var(--border-subtle)",
      icon: g.completedAt ? CheckCircle : Target,
    })),
    ...messageList.map((m) => ({
      date: new Date(m.createdAt),
      type: "message",
      label: m.senderRole === "client" ? "Message from Client" : "Message Sent",
      detail: m.body.length > 80 ? m.body.slice(0, 80) + "…" : m.body,
      href: `/clients/${id}/messages`,
      iconColor: "#0284C7",
      iconBg: "color-mix(in srgb, #0284C7 12%, transparent)",
      iconBorder: "color-mix(in srgb, #0284C7 25%, transparent)",
      icon: MessageSquare,
    })),
    ...invoiceList.map((inv) => ({
      date: new Date(inv.issuedAt),
      type: "invoice",
      label: "Invoice Issued",
      detail: `${inv.description} · $${(inv.amountCents / 100).toFixed(2)} · ${inv.status}`,
      href: "/billing",
      iconColor: "var(--danger)",
      iconBg: "var(--danger-subtle)",
      iconBorder: "color-mix(in srgb, var(--danger) 25%, transparent)",
      icon: Receipt,
    })),
    ...appointmentList.map((a) => ({
      date: new Date(a.scheduledAt),
      type: "appointment",
      label: a.title,
      detail: `Status: ${a.status.replace("_", " ")}`,
      href: "/schedule",
      iconColor: "#EA580C",
      iconBg: "color-mix(in srgb, #EA580C 12%, transparent)",
      iconBorder: "color-mix(in srgb, #EA580C 25%, transparent)",
      icon: CalendarDays,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const fmtDate = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/clients/${id}`} className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--text-tertiary)" }}>
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Timeline</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{client.name} · {events.length} events</p>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-sm" style={{ borderColor: "var(--border-default)", color: "var(--text-tertiary)" }}>
          No events recorded yet for this client.
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px" style={{ background: "var(--border-subtle)" }} />
          <div className="space-y-4">
            {events.map((ev, i) => {
              const Icon = ev.icon;
              const content = (
                <div key={i} className="relative flex items-start gap-4 pl-12">
                  <div
                    className="absolute left-0 w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0"
                    style={{ color: ev.iconColor, background: ev.iconBg, borderColor: ev.iconBorder }}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 rounded-xl border px-4 py-3 transition-colors" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{ev.label}</p>
                      <span className="text-xs shrink-0" style={{ color: "var(--text-tertiary)" }}>{fmtDate(ev.date)}</span>
                    </div>
                    {ev.detail && <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{ev.detail}</p>}
                  </div>
                </div>
              );
              return ev.href ? (
                <Link key={i} href={ev.href}>{content}</Link>
              ) : (
                <div key={i}>{content}</div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
