import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clients, sessions, protocols, checkIns } from "@/lib/db/schema";
import { eq, and, gte, lt, count, avg, desc, max } from "drizzle-orm";
import { Users, Activity, BookOpen, TrendingUp, UserPlus, Settings, Play, CheckCircle, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { DailyActivityChart } from "@/components/DailyActivityChart";
import { RemindAllButton } from "@/components/RemindAllButton";

export default async function DashboardPage() {
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";

  const now = Date.now();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const fortyEightHoursAgo = new Date(now - 48 * 60 * 60 * 1000);

  const [
    clientRows,
    sessionRows,
    prevWeekSessionRows,
    protocolRows,
    avgScoreRows,
    recentSessions,
    last30Sessions,
    allActiveClients,
    recentCheckIns,
  ] = await Promise.all([
    db.select({ count: count() }).from(clients).where(and(eq(clients.clinicId, clinicId), eq(clients.active, true))),
    db
      .select({ count: count() })
      .from(sessions)
      .innerJoin(clients, eq(sessions.clientId, clients.id))
      .where(and(eq(clients.clinicId, clinicId), gte(sessions.startedAt, weekAgo))),
    db
      .select({ count: count() })
      .from(sessions)
      .innerJoin(clients, eq(sessions.clientId, clients.id))
      .where(and(eq(clients.clinicId, clinicId), gte(sessions.startedAt, twoWeeksAgo), lt(sessions.startedAt, weekAgo))),
    db.select({ count: count() }).from(protocols).where(eq(protocols.clinicId, clinicId)),
    db
      .select({ avg: avg(sessions.avgRewardScore) })
      .from(sessions)
      .innerJoin(clients, eq(sessions.clientId, clients.id))
      .where(eq(clients.clinicId, clinicId)),
    db
      .select({
        id: sessions.id,
        clientName: clients.name,
        deviceType: sessions.deviceType,
        startedAt: sessions.startedAt,
        durationSeconds: sessions.durationSeconds,
      })
      .from(sessions)
      .innerJoin(clients, eq(sessions.clientId, clients.id))
      .where(eq(clients.clinicId, clinicId))
      .orderBy(desc(sessions.startedAt))
      .limit(5),
    db
      .select({ startedAt: sessions.startedAt })
      .from(sessions)
      .innerJoin(clients, eq(sessions.clientId, clients.id))
      .where(and(eq(clients.clinicId, clinicId), gte(sessions.startedAt, thirtyDaysAgo))),
    // Active clients with their last session date (for "needs attention" widget)
    db
      .select({
        id: clients.id,
        name: clients.name,
        lastSessionAt: max(sessions.startedAt),
      })
      .from(clients)
      .leftJoin(sessions, eq(sessions.clientId, clients.id))
      .where(and(eq(clients.clinicId, clinicId), eq(clients.active, true)))
      .groupBy(clients.id)
      .orderBy(clients.name),
    // Check-ins submitted in the last 48 hours (via public link)
    db
      .select({
        id: checkIns.id,
        clientId: checkIns.clientId,
        clientName: clients.name,
        date: checkIns.date,
        mood: checkIns.mood,
        anxiety: checkIns.anxiety,
        focus: checkIns.focus,
        energy: checkIns.energy,
        sleepHours: checkIns.sleepHours,
      })
      .from(checkIns)
      .innerJoin(clients, and(eq(checkIns.clientId, clients.id), eq(clients.clinicId, clinicId)))
      .where(gte(checkIns.date, fortyEightHoursAgo))
      .orderBy(desc(checkIns.date))
      .limit(10),
  ]);

  // Build 30-day daily counts
  const countsByDate = new Map<string, number>();
  for (const s of last30Sessions) {
    const day = new Date(s.startedAt).toISOString().split("T")[0];
    countsByDate.set(day, (countsByDate.get(day) ?? 0) + 1);
  }
  const activityData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
    const date = d.toISOString().split("T")[0];
    return { date, count: countsByDate.get(date) ?? 0 };
  });

  const totalClients = Number(clientRows[0]?.count ?? 0);
  const totalProtocols = Number(protocolRows[0]?.count ?? 0);
  const isNewAccount = totalClients === 0 && last30Sessions.length === 0;

  // Clients that need attention: active, no session in 14+ days (or never)
  const attentionClients = allActiveClients
    .filter((c) => {
      if (!c.lastSessionAt) return true; // never had a session
      const daysSince = (now - new Date(c.lastSessionAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince >= 14;
    })
    .slice(0, 5); // show max 5

  const thisWeek = Number(sessionRows[0]?.count ?? 0);
  const lastWeek = Number(prevWeekSessionRows[0]?.count ?? 0);
  const sessionDelta = thisWeek - lastWeek;

  const stats: Array<{
    label: string;
    value: string;
    icon: typeof Users;
    delta?: { value: number; label: string } | null;
  }> = [
    { label: "Active Clients", value: String(totalClients), icon: Users },
    {
      label: "Sessions This Week",
      value: String(thisWeek),
      icon: Activity,
      delta: lastWeek > 0 || thisWeek > 0
        ? { value: sessionDelta, label: `vs last week (${lastWeek})` }
        : null,
    },
    { label: "Protocols", value: String(totalProtocols), icon: BookOpen },
    {
      label: "Avg. Reward Score",
      value: avgScoreRows[0]?.avg != null
        ? `${parseFloat(avgScoreRows[0].avg).toFixed(1)}%`
        : "—",
      icon: TrendingUp,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
      <p className="text-sm text-gray-500 mb-8">
        Welcome back, {session?.user?.name ?? "Clinician"}.
      </p>

      {/* Onboarding guide for new accounts */}
      {isNewAccount && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 mb-8">
          <h2 className="text-base font-semibold text-blue-900 mb-1">Welcome to EEGBase</h2>
          <p className="text-sm text-blue-700 mb-5">
            Get your clinic set up in 3 quick steps.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                step: 1,
                icon: Settings,
                title: "Set up a protocol",
                desc: "Define session duration, device type, and parameters.",
                href: "/protocols",
                done: totalProtocols > 0,
              },
              {
                step: 2,
                icon: UserPlus,
                title: "Add your first client",
                desc: "Add a client to your roster and assign a protocol.",
                href: "/clients",
                done: totalClients > 0,
              },
              {
                step: 3,
                icon: Play,
                title: "Run a session",
                desc: "Start a live neurofeedback session and collect data.",
                href: "/sessions/live",
                done: false,
              },
            ].map(({ step, icon: Icon, title, desc, href, done }) => (
              <Link
                key={step}
                href={href}
                className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${
                  done
                    ? "bg-emerald-50 border-emerald-200 cursor-default"
                    : "bg-white border-blue-100 hover:border-blue-300 hover:bg-white"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    done ? "bg-emerald-100" : "bg-blue-100"
                  }`}
                >
                  {done ? (
                    <CheckCircle size={16} className="text-emerald-600" />
                  ) : (
                    <Icon size={16} className="text-blue-600" />
                  )}
                </div>
                <div>
                  <p className={`text-xs font-semibold mb-0.5 ${done ? "text-emerald-700" : "text-gray-900"}`}>
                    {title}
                  </p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {stats.map(({ label, value, icon: Icon, delta }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4"
          >
            <div className="p-2 rounded-lg bg-blue-50 shrink-0">
              <Icon size={20} className="text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {delta != null && (
                <p className={`text-xs mt-0.5 ${delta.value > 0 ? "text-emerald-600" : delta.value < 0 ? "text-red-500" : "text-gray-400"}`}>
                  {delta.value > 0 ? "+" : ""}{delta.value} {delta.label}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 30-day activity chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Session Activity · Last 30 Days</h2>
          <span className="text-xs text-gray-400">
            {last30Sessions.length} session{last30Sessions.length !== 1 ? "s" : ""} total
          </span>
        </div>
        <DailyActivityChart data={activityData} />
      </div>

      {attentionClients.length > 0 && !isNewAccount && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden mb-6">
          <div className="flex items-center justify-between px-6 py-4 border-b border-amber-100">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <h2 className="text-sm font-semibold text-amber-900">Needs Attention</h2>
              <span className="text-xs text-amber-600 font-medium">
                {attentionClients.length} client{attentionClients.length !== 1 ? "s" : ""} overdue
              </span>
            </div>
            <div className="flex items-center gap-2">
              <RemindAllButton />
              <Link href="/clients" className="text-xs text-amber-700 hover:underline font-medium">
                View all clients →
              </Link>
            </div>
          </div>
          <div className="divide-y divide-amber-100">
            {attentionClients.map((c) => {
              const daysSince = c.lastSessionAt
                ? Math.floor((now - new Date(c.lastSessionAt).getTime()) / (1000 * 60 * 60 * 24))
                : null;
              return (
                <div key={c.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <Link href={`/clients/${c.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
                      {c.name}
                    </Link>
                    <p className="text-xs text-amber-700 mt-0.5">
                      {daysSince === null
                        ? "No sessions yet"
                        : `Last session ${daysSince} day${daysSince !== 1 ? "s" : ""} ago`}
                    </p>
                  </div>
                  <Link
                    href={`/sessions/live?clientId=${c.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Play size={11} /> Schedule
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent check-ins (48h) */}
      {recentCheckIns.length > 0 && !isNewAccount && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl overflow-hidden mb-6">
          <div className="flex items-center justify-between px-6 py-4 border-b border-blue-100">
            <div className="flex items-center gap-2">
              <ClipboardCheck size={16} className="text-blue-600" />
              <h2 className="text-sm font-semibold text-blue-900">New Check-Ins</h2>
              <span className="text-xs text-blue-600 font-medium">
                {recentCheckIns.length} in the last 48 hours
              </span>
            </div>
          </div>
          <div className="divide-y divide-blue-100">
            {recentCheckIns.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-6 py-3 gap-4">
                <div>
                  <Link href={`/clients/${c.clientId}/checkins`} className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
                    {c.clientName}
                  </Link>
                  <p className="text-xs text-blue-700 mt-0.5">
                    {new Date(c.date).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-blue-700 shrink-0">
                  {c.mood != null && <span>Mood <strong>{c.mood}</strong></span>}
                  {c.focus != null && <span>Focus <strong>{c.focus}</strong></span>}
                  {c.anxiety != null && <span>Anxiety <strong>{c.anxiety}</strong></span>}
                  {c.energy != null && <span>Energy <strong>{c.energy}</strong></span>}
                  {c.sleepHours != null && <span>Sleep <strong>{c.sleepHours}h</strong></span>}
                </div>
                <Link
                  href={`/clients/${c.clientId}/checkins`}
                  className="text-xs font-medium text-blue-600 hover:underline shrink-0"
                >
                  View →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Recent Sessions</h2>
          <Link href="/sessions" className="text-sm text-blue-600 hover:underline">
            View all
          </Link>
        </div>

        {recentSessions.length === 0 ? (
          <div className="text-sm text-gray-400 py-10 text-center">
            No sessions yet.{" "}
            <Link href="/sessions/live" className="text-blue-600 hover:underline">
              Start a live session
            </Link>{" "}
            to get started.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Client</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Device</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Date</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Duration</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentSessions.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3.5 font-medium text-gray-900">{s.clientName}</td>
                  <td className="px-6 py-3.5 text-gray-500 capitalize">{s.deviceType}</td>
                  <td className="px-6 py-3.5 text-gray-500">
                    {new Date(s.startedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3.5 text-gray-500">
                    {s.durationSeconds != null
                      ? `${Math.floor(s.durationSeconds / 60)}m ${s.durationSeconds % 60}s`
                      : "—"}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <Link href={`/sessions/${s.id}`} className="text-xs text-blue-600 hover:underline font-medium">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
