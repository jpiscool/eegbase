import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clients, sessions, protocols, assignments } from "@/lib/db/schema";
import { eq, and, gte, count, avg, desc } from "drizzle-orm";
import Link from "next/link";
import { BarChart3, Users, TrendingUp, Calendar } from "lucide-react";

function scoreColor(v: number) {
  if (v >= 70) return "#059669";
  if (v >= 40) return "#D97706";
  return "#DC2626";
}

function DeviceLabel({ d }: { d: string }) {
  const map: Record<string, string> = { mendi: "Mendi fNIRS", muse: "Muse EEG", simulator: "Simulator" };
  return <>{map[d] ?? d}</>;
}

// Mini inline bar (0-100 scale)
function MiniBar({ value, max, color = "#2563EB" }: { value: number; max: number; color?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div style={{ width: `${pct}%`, background: color }} className="h-full rounded-full" />
      </div>
      <span className="text-xs text-gray-600 w-8 text-right">{Math.round(value)}</span>
    </div>
  );
}

// Delta pill for questionnaire improvements
function DeltaBadge({ delta, invert = false }: { delta: number; invert?: boolean }) {
  const improved = invert ? delta < 0 : delta > 0;
  const neutral = delta === 0;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
        neutral
          ? "bg-gray-100 text-gray-500"
          : improved
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-600"
      }`}
    >
      {delta > 0 ? "+" : ""}{delta.toFixed(1)}
    </span>
  );
}

export default async function AnalyticsPage() {
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";

  const now = Date.now();
  const twelveWeeksAgo = new Date(now - 84 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(now - 180 * 24 * 60 * 60 * 1000);

  const [
    allTimeSessions,
    last12wSessions,
    protocolStats,
    deviceStats,
    questionnaireSessions,
    clientEngagement,
  ] = await Promise.all([
    // All-time totals
    db
      .select({ count: count(), avgScore: avg(sessions.avgRewardScore) })
      .from(sessions)
      .innerJoin(clients, eq(sessions.clientId, clients.id))
      .where(eq(clients.clinicId, clinicId)),

    // Last 12 weeks — timestamps for weekly bucketing
    db
      .select({ startedAt: sessions.startedAt })
      .from(sessions)
      .innerJoin(clients, eq(sessions.clientId, clients.id))
      .where(and(eq(clients.clinicId, clinicId), gte(sessions.startedAt, twelveWeeksAgo))),

    // Protocol comparison
    db
      .select({
        protocolId: protocols.id,
        protocolName: protocols.name,
        deviceType: protocols.deviceType,
        sessionCount: count(sessions.id),
        avgReward: avg(sessions.avgRewardScore),
      })
      .from(protocols)
      .leftJoin(sessions, eq(sessions.protocolId, protocols.id))
      .leftJoin(clients, eq(sessions.clientId, clients.id))
      .where(eq(protocols.clinicId, clinicId))
      .groupBy(protocols.id, protocols.name, protocols.deviceType)
      .orderBy(desc(avg(sessions.avgRewardScore)))
      .limit(10),

    // Device breakdown
    db
      .select({ deviceType: sessions.deviceType, sessionCount: count(sessions.id) })
      .from(sessions)
      .innerJoin(clients, eq(sessions.clientId, clients.id))
      .where(eq(clients.clinicId, clinicId))
      .groupBy(sessions.deviceType),

    // Questionnaire deltas (6 months)
    db
      .select({
        preFocus: sessions.preFocus,
        postFocus: sessions.postFocus,
        preMood: sessions.preMood,
        postMood: sessions.postMood,
        preAnxiety: sessions.preAnxiety,
        postAnxiety: sessions.postAnxiety,
        preEnergy: sessions.preEnergy,
        postEnergy: sessions.postEnergy,
      })
      .from(sessions)
      .innerJoin(clients, eq(sessions.clientId, clients.id))
      .where(and(eq(clients.clinicId, clinicId), gte(sessions.startedAt, sixMonthsAgo))),

    // Client engagement (top 10)
    db
      .select({
        clientId: clients.id,
        clientName: clients.name,
        sessionCount: count(sessions.id),
        avgReward: avg(sessions.avgRewardScore),
      })
      .from(clients)
      .leftJoin(sessions, eq(sessions.clientId, clients.id))
      .where(and(eq(clients.clinicId, clinicId), eq(clients.active, true)))
      .groupBy(clients.id, clients.name)
      .orderBy(desc(count(sessions.id)))
      .limit(10),
  ]);

  const totalSessions = Number(allTimeSessions[0]?.count ?? 0);
  const overallAvg = allTimeSessions[0]?.avgScore ? Number(allTimeSessions[0].avgScore) : null;

  // ── Weekly session volume (12 weeks) ────────────────────────────────────────
  const weeklyData = Array.from({ length: 12 }, (_, i) => {
    const weekStart = new Date(now - (11 - i) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    const label = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const cnt = last12wSessions.filter((s) => {
      const t = new Date(s.startedAt).getTime();
      return t >= weekStart.getTime() && t < weekEnd.getTime();
    }).length;
    return { label, cnt };
  });
  const weeklyMax = Math.max(...weeklyData.map((w) => w.cnt), 1);

  // ── Day-of-week distribution ─────────────────────────────────────────────────
  const dowCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun–Sat
  for (const s of last12wSessions) {
    dowCounts[new Date(s.startedAt).getDay()]++;
  }
  const dowLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dowMax = Math.max(...dowCounts, 1);

  // ── Questionnaire improvement ────────────────────────────────────────────────
  const computeDelta = (
    pre: keyof (typeof questionnaireSessions)[0],
    post: keyof (typeof questionnaireSessions)[0]
  ) => {
    const pairs = questionnaireSessions.filter((s) => s[pre] != null && s[post] != null);
    if (pairs.length === 0) return null;
    const sum = pairs.reduce((acc, s) => acc + ((s[post] as number) - (s[pre] as number)), 0);
    return { avg: sum / pairs.length, n: pairs.length };
  };

  const focusDelta = computeDelta("preFocus", "postFocus");
  const moodDelta = computeDelta("preMood", "postMood");
  const anxietyDelta = computeDelta("preAnxiety", "postAnxiety");
  const energyDelta = computeDelta("preEnergy", "postEnergy");

  // ── Device breakdown ─────────────────────────────────────────────────────────
  const totalDeviceSessions = deviceStats.reduce((a, d) => a + Number(d.sessionCount), 0) || 1;

  const hasData = totalSessions > 0;

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-lg bg-blue-50">
          <BarChart3 size={20} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500">Clinic-wide insights across all clients and sessions</p>
        </div>
      </div>

      {!hasData ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BarChart3 size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No session data yet. Run some sessions to see analytics here.</p>
          <Link href="/sessions/live" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
            Start a Session
          </Link>
        </div>
      ) : (
        <>
          {/* ── Top KPIs ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              {
                label: "Total Sessions",
                value: String(totalSessions),
                sub: "all time",
                icon: Calendar,
                color: "text-blue-600",
                bg: "bg-blue-50",
              },
              {
                label: "Avg Reward Score",
                value: overallAvg != null ? `${overallAvg.toFixed(1)}` : "—",
                sub: "across all sessions",
                icon: TrendingUp,
                color: overallAvg != null ? (overallAvg >= 70 ? "text-emerald-600" : overallAvg >= 40 ? "text-amber-600" : "text-red-500") : "text-gray-400",
                bg: "bg-gray-50",
              },
              {
                label: "Sessions (12 wk)",
                value: String(last12wSessions.length),
                sub: "last 12 weeks",
                icon: Activity,
                color: "text-indigo-600",
                bg: "bg-indigo-50",
              },
              {
                label: "Active Clients",
                value: String(clientEngagement.filter((c) => Number(c.sessionCount) > 0).length),
                sub: "with sessions",
                icon: Users,
                color: "text-emerald-600",
                bg: "bg-emerald-50",
              },
            ].map(({ label, value, sub, icon: Icon, color, bg }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-1.5 rounded-lg ${bg}`}>
                    <Icon size={16} className={color} />
                  </div>
                  <span className="text-xs font-medium text-gray-400">{label}</span>
                </div>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* ── Weekly Volume + Day of Week ──────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
            {/* 12-week bar chart */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-5">
                Weekly Session Volume · Last 12 Weeks
              </h2>
              <div className="flex items-end gap-1.5 h-36">
                {weeklyData.map((w) => (
                  <div key={w.label} className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {w.cnt}
                    </span>
                    <div className="w-full flex items-end" style={{ height: "100px" }}>
                      <div
                        className="w-full rounded-t bg-blue-500 hover:bg-blue-600 transition-colors"
                        style={{ height: `${(w.cnt / weeklyMax) * 100}%`, minHeight: w.cnt > 0 ? 3 : 0 }}
                        title={`${w.label}: ${w.cnt}`}
                      />
                    </div>
                    <span className="text-[9px] text-gray-400 whitespace-nowrap overflow-hidden" style={{ maxWidth: "100%", textOverflow: "ellipsis" }}>
                      {w.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Day of week */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-5">
                Sessions by Day (12 wk)
              </h2>
              <div className="space-y-2.5">
                {dowLabels.map((day, i) => (
                  <div key={day} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-7">{day}</span>
                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-400 rounded-full transition-all"
                        style={{ width: `${(dowCounts[i] / dowMax) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-4 text-right">{dowCounts[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Protocol Comparison + Device Breakdown ───────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
            {/* Protocol table */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-700">Protocol Effectiveness</h2>
              </div>
              {protocolStats.filter((p) => Number(p.sessionCount) > 0).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">No sessions with protocols yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-5 py-3 font-medium text-gray-500">Protocol</th>
                      <th className="text-left px-5 py-3 font-medium text-gray-500">Device</th>
                      <th className="text-left px-5 py-3 font-medium text-gray-500">Sessions</th>
                      <th className="text-left px-5 py-3 font-medium text-gray-500 w-36">Avg Reward</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {protocolStats.map((p) => {
                      const avg = p.avgReward ? Number(p.avgReward) : null;
                      return (
                        <tr key={p.protocolId} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3.5 font-medium text-gray-900">
                            <Link href={`/protocols/${p.protocolId}`} className="hover:text-blue-600 transition-colors">
                              {p.protocolName}
                            </Link>
                          </td>
                          <td className="px-5 py-3.5 text-gray-500 text-xs">
                            <DeviceLabel d={p.deviceType} />
                          </td>
                          <td className="px-5 py-3.5 text-gray-500">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              {Number(p.sessionCount)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 w-36">
                            {avg != null ? (
                              <MiniBar value={avg} max={100} color={scoreColor(avg)} />
                            ) : (
                              <span className="text-gray-300 text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Device breakdown */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-5">Device Breakdown</h2>
              <div className="space-y-3">
                {deviceStats.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No data.</p>
                ) : (
                  deviceStats.map((d) => {
                    const cnt = Number(d.sessionCount);
                    const pct = (cnt / totalDeviceSessions) * 100;
                    const colorMap: Record<string, string> = {
                      mendi: "#7C3AED",
                      muse: "#2563EB",
                      simulator: "#64748B",
                    };
                    const color = colorMap[d.deviceType] ?? "#64748B";
                    return (
                      <div key={d.deviceType}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700">
                            <DeviceLabel d={d.deviceType} />
                          </span>
                          <span className="text-xs text-gray-500">{cnt} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: color }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* ── Questionnaire Improvement + Client Engagement ────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            {/* Questionnaire */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-1">Pre → Post Session Improvement</h2>
              <p className="text-xs text-gray-400 mb-5">Average delta across last 6 months. For anxiety, negative = improvement.</p>
              {[focusDelta, moodDelta, anxietyDelta, energyDelta].every((d) => d === null) ? (
                <p className="text-sm text-gray-400 text-center py-6">No questionnaire data yet.</p>
              ) : (
                <div className="space-y-4">
                  {[
                    { label: "Focus", data: focusDelta, invert: false },
                    { label: "Mood", data: moodDelta, invert: false },
                    { label: "Anxiety", data: anxietyDelta, invert: true },
                    { label: "Energy", data: energyDelta, invert: false },
                  ].map(({ label, data, invert }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 w-20">{label}</span>
                      {data ? (
                        <div className="flex items-center gap-3">
                          <DeltaBadge delta={data.avg} invert={invert} />
                          <span className="text-xs text-gray-400">n={data.n}</span>
                        </div>
                      ) : (
                        <span className="text-gray-300 text-sm">—</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Client engagement */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-700">Client Engagement</h2>
              </div>
              {clientEngagement.filter((c) => Number(c.sessionCount) > 0).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">No client sessions yet.</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {clientEngagement
                    .filter((c) => Number(c.sessionCount) > 0)
                    .slice(0, 8)
                    .map((c) => {
                      const avg = c.avgReward ? Number(c.avgReward) : null;
                      return (
                        <div key={c.clientId} className="flex items-center gap-4 px-6 py-3">
                          <Link
                            href={`/clients/${c.clientId}`}
                            className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors flex-1 truncate"
                          >
                            {c.clientName}
                          </Link>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 shrink-0">
                            {Number(c.sessionCount)} sessions
                          </span>
                          {avg != null ? (
                            <span
                              className="text-xs font-semibold w-12 text-right shrink-0"
                              style={{ color: scoreColor(avg) }}
                            >
                              {avg.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300 w-12 text-right shrink-0">—</span>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Inline import since we need it inside JSX
function Activity(props: React.ComponentProps<"svg"> & { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size ?? 24}
      height={props.size ?? 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
