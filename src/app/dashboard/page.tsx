import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clients, sessions, protocols, checkIns, appointments } from "@/lib/db/schema";
import { eq, and, gte, lt, count, avg, desc, max, sql } from "drizzle-orm";
import {
  Users, Activity, BookOpen, TrendingUp, UserPlus, Settings, Play,
  CheckCircle, ClipboardCheck, CalendarDays, Clock, ArrowUpRight,
  ArrowDownRight, Minus, AlertCircle, Zap, Trophy, Target, Star, TrendingDown,
} from "lucide-react";
import Link from "next/link";
import { DailyActivityChart } from "@/components/DailyActivityChart";
import { RemindAllButton } from "@/components/RemindAllButton";

export default async function DashboardPage() {
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";

  const now = Date.now();
  const weekAgo        = new Date(now - 7  * 24 * 60 * 60 * 1000);
  const twoWeeksAgo    = new Date(now - 14 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo  = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const fortyEightHoursAgo = new Date(now - 48 * 60 * 60 * 1000);

  const [
    clientRows, sessionRows, prevWeekSessionRows, protocolRows, avgScoreRows,
    recentSessions, last30Sessions, allActiveClients, recentCheckIns, upcomingAppointments,
    recentScoredSessions, topProtocols, bestDayStats,
  ] = await Promise.all([
    db.select({ count: count() }).from(clients).where(and(eq(clients.clinicId, clinicId), eq(clients.active, true))),
    db.select({ count: count() }).from(sessions).innerJoin(clients, eq(sessions.clientId, clients.id))
      .where(and(eq(clients.clinicId, clinicId), gte(sessions.startedAt, weekAgo))),
    db.select({ count: count() }).from(sessions).innerJoin(clients, eq(sessions.clientId, clients.id))
      .where(and(eq(clients.clinicId, clinicId), gte(sessions.startedAt, twoWeeksAgo), lt(sessions.startedAt, weekAgo))),
    db.select({ count: count() }).from(protocols).where(eq(protocols.clinicId, clinicId)),
    db.select({ avg: avg(sessions.avgRewardScore) }).from(sessions).innerJoin(clients, eq(sessions.clientId, clients.id))
      .where(eq(clients.clinicId, clinicId)),
    db.select({ id: sessions.id, clientName: clients.name, clientId: clients.id, deviceType: sessions.deviceType, startedAt: sessions.startedAt, durationSeconds: sessions.durationSeconds, avgRewardScore: sessions.avgRewardScore })
      .from(sessions).innerJoin(clients, eq(sessions.clientId, clients.id))
      .where(eq(clients.clinicId, clinicId)).orderBy(desc(sessions.startedAt)).limit(6),
    db.select({ startedAt: sessions.startedAt }).from(sessions).innerJoin(clients, eq(sessions.clientId, clients.id))
      .where(and(eq(clients.clinicId, clinicId), gte(sessions.startedAt, thirtyDaysAgo))),
    db.select({ id: clients.id, name: clients.name, lastSessionAt: max(sessions.startedAt) })
      .from(clients).leftJoin(sessions, eq(sessions.clientId, clients.id))
      .where(and(eq(clients.clinicId, clinicId), eq(clients.active, true)))
      .groupBy(clients.id).orderBy(clients.name),
    db.select({ id: checkIns.id, clientId: checkIns.clientId, clientName: clients.name, date: checkIns.date, mood: checkIns.mood, anxiety: checkIns.anxiety, focus: checkIns.focus, energy: checkIns.energy, sleepHours: checkIns.sleepHours })
      .from(checkIns).innerJoin(clients, and(eq(checkIns.clientId, clients.id), eq(clients.clinicId, clinicId)))
      .where(gte(checkIns.date, fortyEightHoursAgo)).orderBy(desc(checkIns.date)).limit(8),
    db.select({ id: appointments.id, scheduledAt: appointments.scheduledAt, durationMinutes: appointments.durationMinutes, title: appointments.title, status: appointments.status, clientId: appointments.clientId, clientName: clients.name })
      .from(appointments).innerJoin(clients, eq(appointments.clientId, clients.id))
      .where(and(eq(appointments.clinicId, clinicId), eq(appointments.status, "scheduled"), gte(appointments.scheduledAt, new Date(now))))
      .orderBy(appointments.scheduledAt).limit(5),
    // Last 500 scored sessions per clinic for client trend detection
    db
      .select({ clientId: sessions.clientId, avgRewardScore: sessions.avgRewardScore, startedAt: sessions.startedAt })
      .from(sessions)
      .innerJoin(clients, and(eq(sessions.clientId, clients.id), eq(clients.clinicId, clinicId)))
      .where(and(eq(clients.active, true), gte(sessions.startedAt, new Date(now - 120 * 24 * 60 * 60 * 1000))))
      .orderBy(desc(sessions.startedAt))
      .limit(500),
    // Top protocols by avg reward score (min 2 sessions)
    db
      .select({
        protocolId: sessions.protocolId,
        protocolName: protocols.name,
        sessionCount: count(sessions.id),
        avgReward: avg(sessions.avgRewardScore),
      })
      .from(sessions)
      .innerJoin(clients, and(eq(sessions.clientId, clients.id), eq(clients.clinicId, clinicId)))
      .leftJoin(protocols, eq(sessions.protocolId, protocols.id))
      .where(gte(sessions.startedAt, thirtyDaysAgo))
      .groupBy(sessions.protocolId, protocols.name)
      .having(sql`count(${sessions.id}) >= 2`)
      .orderBy(desc(avg(sessions.avgRewardScore)))
      .limit(5),
    // Sessions by day of week (last 90 days)
    db
      .select({
        dow: sql<number>`extract(dow from ${sessions.startedAt})`.as("dow"),
        sessionCount: count(sessions.id),
        avgReward: avg(sessions.avgRewardScore),
      })
      .from(sessions)
      .innerJoin(clients, and(eq(sessions.clientId, clients.id), eq(clients.clinicId, clinicId)))
      .where(gte(sessions.startedAt, new Date(now - 90 * 24 * 60 * 60 * 1000)))
      .groupBy(sql`extract(dow from ${sessions.startedAt})`),
  ]);

  const countsByDate = new Map<string, number>();
  for (const s of last30Sessions) {
    const day = new Date(s.startedAt).toISOString().split("T")[0];
    countsByDate.set(day, (countsByDate.get(day) ?? 0) + 1);
  }
  const activityData = Array.from({ length: 30 }, (_, i) => {
    const d    = new Date(now - (29 - i) * 24 * 60 * 60 * 1000);
    const date = d.toISOString().split("T")[0];
    return { date, count: countsByDate.get(date) ?? 0 };
  });

  const totalClients   = Number(clientRows[0]?.count ?? 0);
  const totalProtocols = Number(protocolRows[0]?.count ?? 0);
  const isNewAccount   = totalClients === 0 && last30Sessions.length === 0;
  const thisWeek       = Number(sessionRows[0]?.count ?? 0);
  const lastWeek       = Number(prevWeekSessionRows[0]?.count ?? 0);
  const sessionDelta   = thisWeek - lastWeek;
  const overallAvg     = avgScoreRows[0]?.avg != null ? parseFloat(avgScoreRows[0].avg) : null;

  // Compute per-client score trend from recent sessions
  const scoresByClient = new Map<string, number[]>();
  for (const s of recentScoredSessions) {
    if (s.avgRewardScore == null) continue;
    const arr = scoresByClient.get(s.clientId) ?? [];
    arr.push(Number(s.avgRewardScore));
    scoresByClient.set(s.clientId, arr);
  }
  const decliningClientIds = new Set<string>();
  for (const [clientId, scores] of scoresByClient.entries()) {
    if (scores.length < 4) continue;
    const recent = scores.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const prior = scores.slice(3, 6).reduce((a, b) => a + b, 0) / Math.min(3, scores.slice(3, 6).length);
    if (prior - recent >= 8) decliningClientIds.add(clientId); // 8+ point drop = flagged
  }

  const attentionClients = allActiveClients
    .filter((c) => {
      if (!c.lastSessionAt) return true;
      const overdue = (now - new Date(c.lastSessionAt).getTime()) / (1000 * 60 * 60 * 24) >= 14;
      return overdue || decliningClientIds.has(c.id);
    })
    .map((c) => ({
      ...c,
      daysSince: c.lastSessionAt
        ? Math.floor((now - new Date(c.lastSessionAt).getTime()) / (1000 * 60 * 60 * 24))
        : null,
      declining: decliningClientIds.has(c.id),
    }))
    .sort((a, b) => (b.daysSince ?? 9999) - (a.daysSince ?? 9999))
    .slice(0, 6);

  // KPI cards config
  const kpis = [
    {
      label: "Active Clients",
      value: String(totalClients),
      icon: Users,
      accent: "#2563eb",
      delta: null as null | { n: number; label: string },
    },
    {
      label: "Sessions This Week",
      value: String(thisWeek),
      icon: Activity,
      accent: "#059669",
      delta: (lastWeek > 0 || thisWeek > 0)
        ? { n: sessionDelta, label: `vs last week` }
        : null,
    },
    {
      label: "Protocols",
      value: String(totalProtocols),
      icon: BookOpen,
      accent: "#7c3aed",
      delta: null,
    },
    {
      label: "Avg. Reward Score",
      value: overallAvg != null ? `${overallAvg.toFixed(1)}` : "—",
      icon: TrendingUp,
      accent: overallAvg == null ? "#6b7280" : overallAvg >= 70 ? "#059669" : overallAvg >= 40 ? "#d97706" : "#dc2626",
      delta: null,
    },
  ];

  const scoreColor = (v: number | null) =>
    v == null ? "var(--text-tertiary)"
    : v >= 70 ? "#059669"
    : v >= 40 ? "#d97706"
    : "#dc2626";

  const deviceLabel: Record<string, string> = {
    mendi: "Mendi", muse: "Muse", simulator: "Sim", eeg: "EEG",
  };

  return (
    <div className="max-w-[1200px]">
      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Dashboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            Welcome back, {session?.user?.name?.split(" ")[0] ?? "Clinician"}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/sessions"
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border transition-colors"
            style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}
          >
            <Activity size={14} /> Sessions
          </Link>
          <Link
            href="/sessions/live"
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all"
            style={{ background: "var(--brand)", color: "#fff", boxShadow: "0 2px 8px rgb(37 99 235 / 0.3)" }}
          >
            <Zap size={14} /> Start Session
          </Link>
        </div>
      </div>

      {/* ── Onboarding ─────────────────────────────────────────────────────── */}
      {isNewAccount && (
        <div
          className="rounded-2xl p-6 mb-8 border"
          style={{
            background: "linear-gradient(135deg, var(--brand-subtle) 0%, var(--surface-raised) 100%)",
            borderColor: "var(--brand-muted)",
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base font-semibold" style={{ color: "var(--brand)" }}>Welcome to EEGBase</span>
          </div>
          <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>Get your clinic set up in 3 quick steps.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { step: 1, icon: Settings, title: "Set up a protocol", desc: "Define session duration and parameters.", href: "/protocols", done: totalProtocols > 0 },
              { step: 2, icon: UserPlus, title: "Add your first client", desc: "Add a client and assign a protocol.", href: "/clients", done: totalClients > 0 },
              { step: 3, icon: Play, title: "Run a session", desc: "Start a live neurofeedback session.", href: "/sessions/live", done: false },
            ].map(({ step, icon: Icon, title, desc, href, done }) => (
              <Link
                key={step}
                href={href}
                className="flex items-start gap-3 p-4 rounded-xl border transition-all"
                style={{
                  background: done ? "var(--success-subtle)" : "var(--surface-raised)",
                  borderColor: done ? "#6ee7b7" : "var(--border-subtle)",
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: done ? "#d1fae5" : "var(--brand-subtle)" }}
                >
                  {done ? <CheckCircle size={16} style={{ color: "#059669" }} /> : <Icon size={16} style={{ color: "var(--brand)" }} />}
                </div>
                <div>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: done ? "#065f46" : "var(--text-primary)" }}>{title}</p>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── KPI row ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map(({ label, value, icon: Icon, accent, delta }) => (
          <div
            key={label}
            className="rounded-xl p-5 border-l-4"
            style={{
              background: "var(--surface-raised)",
              borderTopColor: "var(--border-subtle)",
              borderRightColor: "var(--border-subtle)",
              borderBottomColor: "var(--border-subtle)",
              borderLeftColor: accent,
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>{label}</p>
              <Icon size={15} style={{ color: accent }} />
            </div>
            <p className="text-3xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{value}</p>
            {delta != null && (
              <p className="flex items-center gap-1 text-xs mt-1.5" style={{ color: delta.n > 0 ? "#059669" : delta.n < 0 ? "#dc2626" : "var(--text-tertiary)" }}>
                {delta.n > 0 ? <ArrowUpRight size={12} /> : delta.n < 0 ? <ArrowDownRight size={12} /> : <Minus size={12} />}
                {delta.n > 0 ? "+" : ""}{delta.n} {delta.label}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ── Activity chart ─────────────────────────────────────────────────── */}
      <div
        className="rounded-xl p-6 mb-6 border"
        style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Session Activity · Last 30 Days</h2>
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            {last30Sessions.length} session{last30Sessions.length !== 1 ? "s" : ""}
          </span>
        </div>
        <DailyActivityChart data={activityData} />
      </div>

      {/* ── Needs Attention ────────────────────────────────────────────────── */}
      {attentionClients.length > 0 && !isNewAccount && (
        <div
          className="rounded-xl overflow-hidden mb-6 border"
          style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-card)" }}
        >
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={15} style={{ color: "#d97706" }} />
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Needs Attention</h2>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: "var(--warning-subtle)", color: "#b45309" }}
              >
                {attentionClients.length} overdue
              </span>
            </div>
            <div className="flex items-center gap-3">
              <RemindAllButton />
              <Link href="/clients" className="text-xs font-medium transition-colors" style={{ color: "var(--brand)" }}>
                View all →
              </Link>
            </div>
          </div>
          <div>
            {attentionClients.map((c, i) => {
              const overdue = c.daysSince == null || c.daysSince >= 14;
              const urgency =
                c.daysSince == null ? "none"
                : c.daysSince >= 30 ? "high"
                : c.daysSince >= 21 ? "medium"
                : "low";
              const urgencyColor =
                c.declining && !overdue ? "var(--warning)"
                : urgency === "high"   ? "var(--danger)"
                : urgency === "medium" ? "var(--warning)"
                : "var(--text-tertiary)";
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between px-6 py-3 transition-colors"
                  style={{ borderTop: i > 0 ? "1px solid var(--border-subtle)" : undefined }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-8 rounded-full shrink-0" style={{ background: urgencyColor }} />
                    <div>
                      <div className="flex items-center gap-2">
                        <Link href={`/clients/${c.id}`} className="text-sm font-medium transition-colors" style={{ color: "var(--text-primary)" }}>
                          {c.name}
                        </Link>
                        {c.declining && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={{ background: "var(--warning-subtle)", color: "var(--warning)" }}>
                            <TrendingDown size={9} /> Declining
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: urgencyColor }}>
                        {c.daysSince === null
                          ? "No sessions yet"
                          : overdue
                          ? `${c.daysSince} day${c.daysSince !== 1 ? "s" : ""} since last session`
                          : "Reward score dropping"}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/sessions/live?clientId=${c.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors"
                    style={{ background: "var(--brand)", color: "#fff" }}
                  >
                    <Play size={10} /> Session
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Bottom two-column: Check-ins + Appointments ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Check-ins */}
        {recentCheckIns.length > 0 && !isNewAccount && (
          <div
            className="rounded-xl overflow-hidden border"
            style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <div className="flex items-center gap-2">
                <ClipboardCheck size={15} style={{ color: "var(--brand)" }} />
                <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Recent Check-Ins</h2>
                <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: "var(--brand-subtle)", color: "var(--brand)" }}>
                  {recentCheckIns.length}
                </span>
              </div>
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Last 48h</span>
            </div>
            <div>
              {recentCheckIns.slice(0, 4).map((c, i) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 px-5 py-3"
                  style={{ borderTop: i > 0 ? "1px solid var(--border-subtle)" : undefined }}
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/clients/${c.clientId}/checkins`}
                      className="text-sm font-medium transition-colors"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {c.clientName}
                    </Link>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                      {new Date(c.date).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs shrink-0">
                    {([["M", c.mood], ["F", c.focus], ["A", c.anxiety], ["E", c.energy]] as [string, number | null][])
                      .filter(([, v]) => v != null)
                      .map(([l, v]) => (
                        <span
                          key={l}
                          className="flex flex-col items-center leading-tight"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <span className="text-[9px] font-medium" style={{ color: "var(--text-tertiary)" }}>{l}</span>
                          <span className="font-semibold">{v}</span>
                        </span>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming appointments */}
        {upcomingAppointments.length > 0 && !isNewAccount && (
          <div
            className="rounded-xl overflow-hidden border"
            style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <div className="flex items-center gap-2">
                <CalendarDays size={15} style={{ color: "var(--brand)" }} />
                <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Upcoming</h2>
                <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: "var(--brand-subtle)", color: "var(--brand)" }}>
                  {upcomingAppointments.length}
                </span>
              </div>
              <Link href="/schedule" className="text-xs font-medium" style={{ color: "var(--brand)" }}>
                Schedule →
              </Link>
            </div>
            <div>
              {upcomingAppointments.map((appt, i) => {
                const dt       = new Date(appt.scheduledAt);
                const today    = new Date();
                const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
                const isToday    = dt.toDateString() === today.toDateString();
                const isTomorrow = dt.toDateString() === tomorrow.toDateString();
                const dayLabel   = isToday ? "Today" : isTomorrow ? "Tomorrow"
                  : dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                return (
                  <div
                    key={appt.id}
                    className="flex items-center gap-3 px-5 py-3"
                    style={{ borderTop: i > 0 ? "1px solid var(--border-subtle)" : undefined }}
                  >
                    <div
                      className="w-1 h-8 rounded-full shrink-0"
                      style={{ background: isToday ? "var(--brand)" : "var(--border-default)" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{appt.title}</p>
                      <Link href={`/clients/${appt.clientId}`} className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                        {appt.clientName}
                      </Link>
                    </div>
                    <div className="flex flex-col items-end text-xs shrink-0" style={{ color: isToday ? "var(--brand)" : "var(--text-tertiary)" }}>
                      <span className="font-medium">{dayLabel}</span>
                      <span>{dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Recent Sessions ────────────────────────────────────────────────── */}
      <div
        className="rounded-xl overflow-hidden border"
        style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Recent Sessions</h2>
          <Link href="/sessions" className="text-xs font-medium" style={{ color: "var(--brand)" }}>
            View all →
          </Link>
        </div>

        {recentSessions.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
            No sessions yet.{" "}
            <Link href="/sessions/live" style={{ color: "var(--brand)" }} className="hover:underline">
              Start a live session
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--surface-sunken)" }}>
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>Client</th>
                <th className="text-left px-6 py-3 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>Device</th>
                <th className="text-left px-6 py-3 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>Date</th>
                <th className="text-left px-6 py-3 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>Duration</th>
                <th className="text-right px-6 py-3 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>Score</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {recentSessions.map((s, i) => (
                <tr
                  key={s.id}
                  className="transition-colors"
                  style={{
                    borderTop: i > 0 ? "1px solid var(--border-subtle)" : undefined,
                  }}
                >
                  <td className="px-6 py-3.5">
                    <Link href={`/clients/${s.clientId}`} className="font-medium hover:underline" style={{ color: "var(--text-primary)" }}>
                      {s.clientName}
                    </Link>
                  </td>
                  <td className="px-6 py-3.5">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium"
                      style={{ background: "var(--surface-sunken)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
                    >
                      {deviceLabel[s.deviceType] ?? s.deviceType}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                    {new Date(s.startedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </td>
                  <td className="px-6 py-3.5 text-sm tabular-nums" style={{ color: "var(--text-secondary)" }}>
                    {s.durationSeconds != null ? `${Math.floor(s.durationSeconds / 60)}m` : "—"}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <span className="font-semibold tabular-nums text-sm" style={{ color: scoreColor(s.avgRewardScore) }}>
                      {s.avgRewardScore != null ? s.avgRewardScore.toFixed(1) : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link
                      href={`/sessions/${s.id}`}
                      className="text-xs font-medium transition-colors hover:underline"
                      style={{ color: "var(--brand)" }}
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Clinic Performance Insights ────────────────────────────────────── */}
      {(topProtocols.length > 0 || bestDayStats.length > 0) && !isNewAccount && (() => {
        const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const bestDay = bestDayStats.length > 0
          ? bestDayStats.reduce((best, d) => Number(d.avgReward ?? 0) > Number(best.avgReward ?? 0) ? d : best, bestDayStats[0])
          : null;
        const busiestDay = bestDayStats.length > 0
          ? bestDayStats.reduce((best, d) => Number(d.sessionCount) > Number(best.sessionCount) ? d : best, bestDayStats[0])
          : null;

        return (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Protocols */}
            {topProtocols.length > 0 && (
              <div
                className="rounded-xl overflow-hidden border"
                style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-card)" }}
              >
                <div
                  className="flex items-center gap-2 px-5 py-4"
                  style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--surface-sunken)" }}
                >
                  <Trophy size={14} style={{ color: "#d97706" }} />
                  <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Top Protocols · Last 30 Days</h2>
                </div>
                <div className="p-5 space-y-3">
                  {topProtocols.map((p, i) => {
                    const avg = p.avgReward != null ? parseFloat(String(p.avgReward)) : null;
                    const maxAvg = topProtocols[0]?.avgReward != null ? parseFloat(String(topProtocols[0].avgReward)) : 100;
                    const pct = avg != null ? Math.min(100, (avg / Math.max(maxAvg, 1)) * 100) : 0;
                    const color = avg == null ? "#6b7280" : avg >= 70 ? "#059669" : avg >= 40 ? "#d97706" : "#dc2626";
                    return (
                      <div key={p.protocolId ?? i}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {i === 0 && <Star size={11} style={{ color: "#d97706", fill: "#d97706" }} />}
                            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                              {p.protocolName ?? "Unknown"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{p.sessionCount} sessions</span>
                            <span className="text-sm font-bold tabular-nums" style={{ color }}>
                              {avg != null ? avg.toFixed(1) : "—"}
                            </span>
                          </div>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="px-5 pb-4">
                  <Link href="/protocols" className="text-xs font-medium" style={{ color: "var(--brand)" }}>
                    View all protocols →
                  </Link>
                </div>
              </div>
            )}

            {/* Day of Week Performance */}
            {bestDayStats.length >= 3 && (
              <div
                className="rounded-xl overflow-hidden border"
                style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-card)" }}
              >
                <div
                  className="flex items-center gap-2 px-5 py-4"
                  style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--surface-sunken)" }}
                >
                  <Target size={14} style={{ color: "var(--brand)" }} />
                  <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Sessions by Day of Week · Last 90 Days</h2>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {DOW_LABELS.map((day, dow) => {
                      const stat = bestDayStats.find((d) => Number(d.dow) === dow);
                      const sessions = Number(stat?.sessionCount ?? 0);
                      const maxSessions = Math.max(...bestDayStats.map((d) => Number(d.sessionCount)), 1);
                      const heightPct = Math.max(8, (sessions / maxSessions) * 100);
                      const isBest = busiestDay && Number(busiestDay.dow) === dow;
                      return (
                        <div key={day} className="flex flex-col items-center gap-1">
                          <div className="w-full flex flex-col items-center justify-end" style={{ height: "60px" }}>
                            <div
                              className="w-full rounded-t-sm transition-all"
                              style={{
                                height: `${heightPct}%`,
                                background: isBest ? "var(--brand)" : "var(--border-default)",
                                opacity: sessions === 0 ? 0.3 : 1,
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-medium" style={{ color: isBest ? "var(--brand)" : "var(--text-tertiary)" }}>
                            {day}
                          </span>
                          <span className="text-[10px] tabular-nums" style={{ color: "var(--text-tertiary)" }}>
                            {sessions}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-4 text-xs pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                    {busiestDay && (
                      <div>
                        <span style={{ color: "var(--text-tertiary)" }}>Busiest: </span>
                        <span className="font-semibold" style={{ color: "var(--brand)" }}>
                          {DOW_LABELS[Number(busiestDay.dow)]} ({busiestDay.sessionCount} sessions)
                        </span>
                      </div>
                    )}
                    {bestDay && bestDay.avgReward != null && (
                      <div>
                        <span style={{ color: "var(--text-tertiary)" }}>Best scores: </span>
                        <span className="font-semibold" style={{ color: "#059669" }}>
                          {DOW_LABELS[Number(bestDay.dow)]}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
