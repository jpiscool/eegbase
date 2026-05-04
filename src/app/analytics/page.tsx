import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clients, sessions, protocols, assignments, sessionDataPoints } from "@/lib/db/schema";
import { eq, and, gte, count, avg, desc, asc, sql, arrayContains, isNotNull } from "drizzle-orm";
import Link from "next/link";
import { BarChart3, Users, TrendingUp, Calendar, Zap } from "lucide-react";

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
function MiniBar({ value, max, color = "var(--brand)" }: { value: number; max: number; color?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-sunken)" }}>
        <div style={{ width: `${pct}%`, background: color }} className="h-full rounded-full" />
      </div>
      <span className="text-xs w-8 text-right" style={{ color: "var(--text-secondary)" }}>{Math.round(value)}</span>
    </div>
  );
}

// Delta pill for questionnaire improvements
function DeltaBadge({ delta, invert = false }: { delta: number; invert?: boolean }) {
  const improved = invert ? delta < 0 : delta > 0;
  const neutral = delta === 0;
  const style: React.CSSProperties = neutral
    ? { background: "var(--surface-sunken)", color: "var(--text-secondary)" }
    : improved
    ? { background: "var(--success-subtle)", color: "var(--success)" }
    : { background: "var(--danger-subtle)", color: "var(--danger)" };
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold" style={style}>
      {delta > 0 ? "+" : ""}{delta.toFixed(1)}
    </span>
  );
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";
  const { tag: selectedTag } = await searchParams;

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
    rewardTrajectoryRaw,
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

    // Reward trajectory — all sessions with scores from last 6 months, ordered by date
    db
      .select({
        clientId: sessions.clientId,
        clientName: clients.name,
        startedAt: sessions.startedAt,
        avgRewardScore: sessions.avgRewardScore,
      })
      .from(sessions)
      .innerJoin(clients, eq(sessions.clientId, clients.id))
      .where(and(eq(clients.clinicId, clinicId), gte(sessions.startedAt, sixMonthsAgo)))
      .orderBy(asc(sessions.startedAt)),
  ]);

  // ── Mendi fNIRS summary (this month) ────────────────────────────────────────
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const mendiSessionsThisMonth = await db
    .select({
      id: sessions.id,
      clientId: sessions.clientId,
      clientName: clients.name,
      avgRewardScore: sessions.avgRewardScore,
    })
    .from(sessions)
    .innerJoin(clients, eq(sessions.clientId, clients.id))
    .where(
      and(
        eq(clients.clinicId, clinicId),
        eq(sessions.deviceType, "mendi"),
        gte(sessions.startedAt, startOfMonth)
      )
    );

  const mendiCount = mendiSessionsThisMonth.length;

  // Avg bilateral balance from session_data_points for mendi sessions this month
  const mendiSessionIds = mendiSessionsThisMonth.map((s) => s.id);

  let avgOxyLeft: number | null = null;
  let avgOxyRight: number | null = null;
  let bestClientName: string | null = null;
  let bestClientAvgReward: number | null = null;

  if (mendiSessionIds.length > 0) {
    const oxyHbAvgs = await db
      .select({
        avgLeft: avg(sessionDataPoints.oxyHbLeft),
        avgRight: avg(sessionDataPoints.oxyHbRight),
      })
      .from(sessionDataPoints)
      .where(
        sql`${sessionDataPoints.sessionId} = ANY(ARRAY[${sql.raw(mendiSessionIds.map((id) => `'${id}'`).join(","))}]::uuid[])`
      );

    avgOxyLeft = oxyHbAvgs[0]?.avgLeft != null ? Number(oxyHbAvgs[0].avgLeft) : null;
    avgOxyRight = oxyHbAvgs[0]?.avgRight != null ? Number(oxyHbAvgs[0].avgRight) : null;

    // Best client by avg reward score
    const clientRewardMap = new Map<string, { name: string; total: number; count: number }>();
    for (const s of mendiSessionsThisMonth) {
      if (s.avgRewardScore == null) continue;
      const key = s.clientId;
      const existing = clientRewardMap.get(key);
      if (existing) {
        existing.total += Number(s.avgRewardScore);
        existing.count++;
      } else {
        clientRewardMap.set(key, { name: s.clientName, total: Number(s.avgRewardScore), count: 1 });
      }
    }
    let bestAvg = -Infinity;
    for (const [, { name, total, count: c }] of clientRewardMap) {
      const clientAvg = total / c;
      if (clientAvg > bestAvg) {
        bestAvg = clientAvg;
        bestClientName = name;
        bestClientAvgReward = clientAvg;
      }
    }
  }

  // Referral source breakdown
  const referralStats = await db
    .select({ source: clients.referralSource, clientCount: count() })
    .from(clients)
    .where(and(eq(clients.clinicId, clinicId), isNotNull(clients.referralSource)))
    .groupBy(clients.referralSource)
    .orderBy(desc(count()))
    .limit(10);

  // ── Tag analytics ────────────────────────────────────────────────────────────
  const allTagsRaw = await db
    .select({ tag: sql<string>`unnest(${sessions.tags})` })
    .from(sessions)
    .innerJoin(clients, eq(sessions.clientId, clients.id))
    .where(and(eq(clients.clinicId, clinicId), sql`${sessions.tags} is not null`));
  const allTags = [...new Set(allTagsRaw.map((r) => r.tag))].sort();

  const tagSessions = selectedTag
    ? await db
        .select({
          clientId: sessions.clientId,
          clientName: clients.name,
          avgRewardScore: sessions.avgRewardScore,
          startedAt: sessions.startedAt,
        })
        .from(sessions)
        .innerJoin(clients, eq(sessions.clientId, clients.id))
        .where(and(eq(clients.clinicId, clinicId), arrayContains(sessions.tags, [selectedTag])))
        .orderBy(desc(sessions.startedAt))
    : [];

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

  // ── Reward trajectory per client ─────────────────────────────────────────────
  // Group sessions by client, compute first-3 avg, last-3 avg, and sparkline points
  const trajectoryMap = new Map<string, { name: string; points: number[] }>();
  for (const row of rewardTrajectoryRaw) {
    if (row.avgRewardScore == null) continue;
    const key = row.clientId;
    if (!trajectoryMap.has(key)) {
      trajectoryMap.set(key, { name: row.clientName, points: [] });
    }
    trajectoryMap.get(key)!.points.push(Number(row.avgRewardScore));
  }
  const trajectoryClients = Array.from(trajectoryMap.entries())
    .filter(([, v]) => v.points.length >= 3)
    .map(([clientId, { name, points }]) => {
      const firstAvg = points.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
      const lastAvg = points.slice(-3).reduce((a, b) => a + b, 0) / 3;
      const delta = lastAvg - firstAvg;
      return { clientId, name, points, firstAvg, lastAvg, delta };
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)) // biggest movers first
    .slice(0, 6);

  const hasData = totalSessions > 0;

  return (
    <>
      <style>{`
        .analytics-row:hover { background: var(--surface-sunken); }
      `}</style>
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-lg" style={{ background: "color-mix(in srgb, var(--brand) 10%, transparent)" }}>
          <BarChart3 size={20} style={{ color: "var(--brand)" }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Analytics</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Clinic-wide insights across all clients and sessions</p>
        </div>
      </div>

      {/* ── Mendi fNIRS Summary ─────────────────────────────────────────────── */}
      <div
        className="rounded-xl border p-5 mb-6"
        style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div
            className="p-1.5 rounded-lg"
            style={{ background: "color-mix(in srgb, #7C3AED 10%, transparent)" }}
          >
            <Zap size={16} style={{ color: "#7C3AED" }} />
          </div>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Mendi fNIRS Summary
            </h2>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              This calendar month
            </p>
          </div>
        </div>

        {mendiCount === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            No Mendi sessions recorded this month.
          </p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Mendi sessions */}
            <div
              className="rounded-lg p-4"
              style={{ background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)" }}
            >
              <p className="text-xs font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>
                Sessions (month)
              </p>
              <p className="text-2xl font-bold" style={{ color: "#7C3AED" }}>{mendiCount}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>Mendi device</p>
            </div>

            {/* Avg oxyHb Left */}
            <div
              className="rounded-lg p-4"
              style={{ background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)" }}
            >
              <p className="text-xs font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>
                Avg oxyHb Left
              </p>
              <p className="text-2xl font-bold" style={{ color: "#7C3AED" }}>
                {avgOxyLeft != null ? avgOxyLeft.toFixed(2) : "—"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>μmol/L</p>
            </div>

            {/* Avg oxyHb Right */}
            <div
              className="rounded-lg p-4"
              style={{ background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)" }}
            >
              <p className="text-xs font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>
                Avg oxyHb Right
              </p>
              <p className="text-2xl font-bold" style={{ color: "#7C3AED" }}>
                {avgOxyRight != null ? avgOxyRight.toFixed(2) : "—"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>μmol/L</p>
            </div>

            {/* Best performing client */}
            <div
              className="rounded-lg p-4"
              style={{ background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)" }}
            >
              <p className="text-xs font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>
                Top Client (reward)
              </p>
              {bestClientName ? (
                <>
                  <p
                    className="text-sm font-bold truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {bestClientName}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--success)" }}>
                    avg {bestClientAvgReward!.toFixed(1)} reward
                  </p>
                </>
              ) : (
                <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>—</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Tag Filter ──────────────────────────────────────────────────────── */}
      {allTags.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium mr-1" style={{ color: "var(--text-secondary)" }}>Filter by tag:</span>
          <Link
            href="/analytics"
            className="px-3 py-1 text-xs font-medium rounded-full border transition-colors"
            style={!selectedTag
              ? { background: "var(--brand)", color: "var(--text-inverse)", borderColor: "var(--brand)" }
              : { background: "var(--surface-raised)", color: "var(--text-secondary)", borderColor: "var(--border-default)" }}
          >
            All
          </Link>
          {allTags.map((t) => (
            <Link
              key={t}
              href={`/analytics?tag=${encodeURIComponent(t)}`}
              className="px-3 py-1 text-xs font-medium rounded-full border transition-colors"
              style={selectedTag === t
                ? { background: "var(--brand)", color: "var(--text-inverse)", borderColor: "var(--brand)" }
                : { background: "var(--surface-raised)", color: "var(--text-secondary)", borderColor: "var(--border-default)" }}
            >
              {t}
            </Link>
          ))}
        </div>
      )}

      {/* ── Tag Analysis Section ─────────────────────────────────────────────── */}
      {selectedTag && (
        <div className="rounded-xl p-5 mb-6" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
            Tag analysis: <span style={{ color: "var(--brand)" }}>{selectedTag}</span>
            <span className="ml-2 font-normal" style={{ color: "var(--text-tertiary)" }}>({tagSessions.length} sessions)</span>
          </h2>
          {tagSessions.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No sessions found with this tag.</p>
          ) : (
            <div className="space-y-2">
              {(() => {
                const scores = tagSessions.filter((s) => s.avgRewardScore != null).map((s) => Number(s.avgRewardScore));
                const tagAvg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
                const clientCounts = new Map<string, { name: string; count: number }>();
                for (const s of tagSessions) {
                  const existing = clientCounts.get(s.clientId);
                  if (existing) existing.count++;
                  else clientCounts.set(s.clientId, { name: s.clientName, count: 1 });
                }
                return (
                  <>
                    <div className="flex gap-6 text-sm mb-3">
                      <div><span style={{ color: "var(--text-secondary)" }}>Avg reward:</span> <strong>{tagAvg != null ? tagAvg.toFixed(1) : "—"}</strong></div>
                      <div><span style={{ color: "var(--text-secondary)" }}>Clients:</span> <strong>{clientCounts.size}</strong></div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[...clientCounts.entries()].map(([id, { name, count }]) => (
                        <Link key={id} href={`/clients/${id}`} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs transition-colors" style={{ background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}>
                          {name} <span style={{ color: "var(--text-tertiary)" }}>·</span> {count} session{count !== 1 ? "s" : ""}
                        </Link>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {!hasData ? (
        <div className="rounded-xl border p-12 text-center" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
          <BarChart3 size={32} className="mx-auto mb-3" style={{ color: "var(--text-tertiary)" }} />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No session data yet. Run some sessions to see analytics here.</p>
          <Link href="/sessions/live" className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors" style={{ background: "var(--brand)", color: "var(--text-inverse)" }}>
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
                colorV: "var(--brand)",
              },
              {
                label: "Avg Reward Score",
                value: overallAvg != null ? `${overallAvg.toFixed(1)}` : "—",
                sub: "across all sessions",
                icon: TrendingUp,
                colorV: overallAvg != null ? (overallAvg >= 70 ? "var(--success)" : overallAvg >= 40 ? "var(--warning)" : "var(--danger)") : "var(--text-tertiary)",
              },
              {
                label: "Sessions (12 wk)",
                value: String(last12wSessions.length),
                sub: "last 12 weeks",
                icon: Activity,
                colorV: "#6366f1",
              },
              {
                label: "Active Clients",
                value: String(clientEngagement.filter((c) => Number(c.sessionCount) > 0).length),
                sub: "with sessions",
                icon: Users,
                colorV: "var(--success)",
              },
            ].map(({ label, value, sub, icon: Icon, colorV }) => (
              <div key={label} className="rounded-xl border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-1.5 rounded-lg" style={{ background: `color-mix(in srgb, ${colorV} 12%, transparent)` }}>
                    <Icon size={16} style={{ color: colorV }} />
                  </div>
                  <span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>{label}</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: colorV }}>{value}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{sub}</p>
              </div>
            ))}
          </div>

          {/* ── Weekly Volume + Day of Week ──────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
            {/* 12-week bar chart */}
            <div className="lg:col-span-2 rounded-xl border p-6" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
              <h2 className="text-sm font-semibold mb-5" style={{ color: "var(--text-primary)" }}>
                Weekly Session Volume · Last 12 Weeks
              </h2>
              <div className="flex items-end gap-1.5 h-36">
                {weeklyData.map((w) => (
                  <div key={w.label} className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-tertiary)" }}>
                      {w.cnt}
                    </span>
                    <div className="w-full flex items-end" style={{ height: "100px" }}>
                      <div
                        className="w-full rounded-t transition-colors"
                        style={{ height: `${(w.cnt / weeklyMax) * 100}%`, minHeight: w.cnt > 0 ? 3 : 0, background: "var(--brand)" }}
                        title={`${w.label}: ${w.cnt}`}
                      />
                    </div>
                    <span className="text-[9px] whitespace-nowrap overflow-hidden" style={{ maxWidth: "100%", textOverflow: "ellipsis", color: "var(--text-tertiary)" }}>
                      {w.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Day of week */}
            <div className="rounded-xl border p-6" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
              <h2 className="text-sm font-semibold mb-5" style={{ color: "var(--text-primary)" }}>
                Sessions by Day (12 wk)
              </h2>
              <div className="space-y-2.5">
                {dowLabels.map((day, i) => (
                  <div key={day} className="flex items-center gap-3">
                    <span className="text-xs w-7" style={{ color: "var(--text-tertiary)" }}>{day}</span>
                    <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: "var(--surface-sunken)" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${(dowCounts[i] / dowMax) * 100}%`, background: "#6366f1" }}
                      />
                    </div>
                    <span className="text-xs w-4 text-right" style={{ color: "var(--text-secondary)" }}>{dowCounts[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Protocol Comparison + Device Breakdown ───────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
            {/* Protocol table */}
            <div className="lg:col-span-2 rounded-xl border overflow-hidden" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
              <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border-subtle)" }}>
                <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Protocol Effectiveness</h2>
                <Link href="/analytics/protocols" className="text-xs hover:underline" style={{ color: "var(--brand)" }}>Full report →</Link>
              </div>
              {protocolStats.filter((p) => Number(p.sessionCount) > 0).length === 0 ? (
                <p className="text-sm text-center py-10" style={{ color: "var(--text-tertiary)" }}>No sessions with protocols yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead style={{ background: "var(--surface-sunken)", borderBottom: "1px solid var(--border-subtle)" }}>
                    <tr>
                      <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>Protocol</th>
                      <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>Device</th>
                      <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>Sessions</th>
                      <th className="text-left px-5 py-3 font-medium w-36" style={{ color: "var(--text-secondary)" }}>Avg Reward</th>
                    </tr>
                  </thead>
                  <tbody>
                    {protocolStats.map((p) => {
                      const avg = p.avgReward ? Number(p.avgReward) : null;
                      return (
                        <tr key={p.protocolId} className="analytics-row transition-colors" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                          <td className="px-5 py-3.5 font-medium" style={{ color: "var(--text-primary)" }}>
                            <Link href={`/protocols/${p.protocolId}`} className="hover:underline transition-colors" style={{ color: "var(--text-primary)" }}>
                              {p.protocolName}
                            </Link>
                          </td>
                          <td className="px-5 py-3.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                            <DeviceLabel d={p.deviceType} />
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "var(--surface-sunken)", color: "var(--text-secondary)" }}>
                              {Number(p.sessionCount)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 w-36">
                            {avg != null ? (
                              <MiniBar value={avg} max={100} color={scoreColor(avg)} />
                            ) : (
                              <span className="text-xs" style={{ color: "var(--border-default)" }}>—</span>
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
            <div className="rounded-xl border p-6" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
              <h2 className="text-sm font-semibold mb-5" style={{ color: "var(--text-primary)" }}>Device Breakdown</h2>
              <div className="space-y-3">
                {deviceStats.length === 0 ? (
                  <p className="text-sm text-center py-4" style={{ color: "var(--text-tertiary)" }}>No data.</p>
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
                          <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                            <DeviceLabel d={d.deviceType} />
                          </span>
                          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{cnt} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-sunken)" }}>
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

          {/* ── Reward Score Trajectory ──────────────────────────────────── */}
          {trajectoryClients.length > 0 && (
            <div className="rounded-xl border p-6 mb-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={15} style={{ color: "var(--success)" }} />
                <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Reward Score Trajectory</h2>
              </div>
              <p className="text-xs mb-5" style={{ color: "var(--text-tertiary)" }}>
                First 3 sessions avg vs. last 3 sessions avg · clients with ≥ 3 sessions in the last 6 months · sorted by largest change
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {trajectoryClients.map(({ clientId, name, points, firstAvg, lastAvg, delta }) => {
                  const sparkMax = Math.max(...points, 1);
                  const improved = delta >= 0;
                  return (
                    <div key={clientId} className="rounded-xl p-4 transition-colors" style={{ border: "1px solid var(--border-subtle)" }}>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <Link href={`/clients/${clientId}`} className="text-sm font-semibold transition-colors truncate" style={{ color: "var(--text-primary)" }}>
                          {name}
                        </Link>
                        <span
                          className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
                          style={improved
                            ? { background: "var(--success-subtle)", color: "var(--success)" }
                            : { background: "var(--danger-subtle)", color: "var(--danger)" }}
                        >
                          {delta >= 0 ? "+" : ""}{delta.toFixed(1)}
                        </span>
                      </div>

                      {/* SVG sparkline */}
                      <svg viewBox={`0 0 ${points.length * 10} 30`} className="w-full h-8 mb-2" preserveAspectRatio="none">
                        <polyline
                          points={points.map((v, i) => `${i * 10 + 5},${30 - (v / sparkMax) * 26}`).join(" ")}
                          fill="none"
                          stroke={improved ? "#059669" : "#DC2626"}
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {points.map((v, i) => (
                          <circle
                            key={i}
                            cx={i * 10 + 5}
                            cy={30 - (v / sparkMax) * 26}
                            r="2"
                            fill={improved ? "#059669" : "#DC2626"}
                          />
                        ))}
                      </svg>

                      <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-tertiary)" }}>
                        <span>First avg <strong style={{ color: scoreColor(firstAvg) }}>{firstAvg.toFixed(1)}</strong></span>
                        <span>{points.length} sessions</span>
                        <span>Recent avg <strong style={{ color: scoreColor(lastAvg) }}>{lastAvg.toFixed(1)}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Questionnaire Improvement + Client Engagement ────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            {/* Questionnaire */}
            <div className="rounded-xl border p-6" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
              <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Pre → Post Session Improvement</h2>
              <p className="text-xs mb-5" style={{ color: "var(--text-tertiary)" }}>Average delta across last 6 months. For anxiety, negative = improvement.</p>
              {[focusDelta, moodDelta, anxietyDelta, energyDelta].every((d) => d === null) ? (
                <p className="text-sm text-center py-6" style={{ color: "var(--text-tertiary)" }}>No questionnaire data yet.</p>
              ) : (
                <div className="space-y-4">
                  {[
                    { label: "Focus", data: focusDelta, invert: false },
                    { label: "Mood", data: moodDelta, invert: false },
                    { label: "Anxiety", data: anxietyDelta, invert: true },
                    { label: "Energy", data: energyDelta, invert: false },
                  ].map(({ label, data, invert }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-sm w-20" style={{ color: "var(--text-primary)" }}>{label}</span>
                      {data ? (
                        <div className="flex items-center gap-3">
                          <DeltaBadge delta={data.avg} invert={invert} />
                          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>n={data.n}</span>
                        </div>
                      ) : (
                        <span className="text-sm" style={{ color: "var(--border-default)" }}>—</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Client engagement */}
            <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
              <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Client Engagement</h2>
              </div>
              {clientEngagement.filter((c) => Number(c.sessionCount) > 0).length === 0 ? (
                <p className="text-sm text-center py-10" style={{ color: "var(--text-tertiary)" }}>No client sessions yet.</p>
              ) : (
                <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                  {clientEngagement
                    .filter((c) => Number(c.sessionCount) > 0)
                    .slice(0, 8)
                    .map((c) => {
                      const avg = c.avgReward ? Number(c.avgReward) : null;
                      return (
                        <div key={c.clientId} className="flex items-center gap-4 px-6 py-3">
                          <Link
                            href={`/clients/${c.clientId}`}
                            className="text-sm font-medium transition-colors flex-1 truncate"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {c.clientName}
                          </Link>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0" style={{ background: "var(--surface-sunken)", color: "var(--text-secondary)" }}>
                            {Number(c.sessionCount)} sessions
                          </span>
                          {avg != null ? (
                            <span className="text-xs font-semibold w-12 text-right shrink-0" style={{ color: scoreColor(avg) }}>
                              {avg.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-xs w-12 text-right shrink-0" style={{ color: "var(--border-default)" }}>—</span>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* ── Referral Sources ────────────────────────────────────────────── */}
          {referralStats.length > 0 && (
            <div className="rounded-xl border p-6 mb-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
              <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Client Referral Sources</h2>
              <p className="text-xs mb-4" style={{ color: "var(--text-tertiary)" }}>
                How clients are finding your practice ({referralStats.reduce((a, r) => a + Number(r.clientCount), 0)} clients with source recorded)
              </p>
              <div className="space-y-2.5">
                {(() => {
                  const maxCount = Math.max(...referralStats.map((r) => Number(r.clientCount)));
                  return referralStats.map((r) => (
                    <div key={r.source} className="flex items-center gap-3">
                      <span className="text-xs w-36 shrink-0 truncate" style={{ color: "var(--text-secondary)" }}>{r.source}</span>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-sunken)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(Number(r.clientCount) / maxCount) * 100}%`, background: "var(--brand)" }}
                        />
                      </div>
                      <span className="text-xs font-semibold w-6 text-right" style={{ color: "var(--text-primary)" }}>{r.clientCount}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {/* ── Network Benchmarks ──────────────────────────────────────────── */}
          <div className="rounded-xl border p-6 mb-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>EEGBase Network Benchmarks</h2>
              <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: "var(--brand-subtle)", color: "var(--brand)" }}>Beta</span>
            </div>
            <p className="text-xs mb-5" style={{ color: "var(--text-tertiary)" }}>
              Anonymous aggregated averages from EEGBase clinics (opt-in). Your metrics vs. the network.
            </p>
            {(() => {
              const clinicAvg = overallAvg ?? 0;
              const NETWORK = [
                { label: "Avg Reward Score", yours: clinicAvg > 0 ? clinicAvg.toFixed(1) : "—", network: "54.2", unit: "", higher: true },
                { label: "Sessions / Client", yours: clientEngagement.length > 0 ? (totalSessions / clientEngagement.length).toFixed(1) : "—", network: "18.4", unit: "", higher: true },
                { label: "Pre→Post Focus Δ", yours: focusDelta != null ? `+${focusDelta.avg.toFixed(1)}` : "—", network: "+1.4", unit: "", higher: true },
                { label: "Pre→Post Anxiety Δ", yours: anxietyDelta != null ? anxietyDelta.avg.toFixed(1) : "—", network: "-1.1", unit: "", higher: false },
              ];
              return (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {NETWORK.map((m) => {
                    const yoursNum = parseFloat(String(m.yours));
                    const networkNum = parseFloat(m.network);
                    const beating = !isNaN(yoursNum) && (m.higher ? yoursNum >= networkNum : yoursNum <= networkNum);
                    const behind = !isNaN(yoursNum) && (m.higher ? yoursNum < networkNum : yoursNum > networkNum);
                    return (
                      <div key={m.label} className="rounded-lg p-4" style={{ background: "var(--surface-sunken)" }}>
                        <p className="text-xs font-medium mb-2" style={{ color: "var(--text-tertiary)" }}>{m.label}</p>
                        <div className="flex items-end gap-3">
                          <div>
                            <p className="text-xl font-bold" style={{ color: beating ? "var(--success)" : behind ? "var(--warning)" : "var(--text-primary)" }}>
                              {m.yours}
                            </p>
                            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Your clinic</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>{m.network}</p>
                            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Network avg</p>
                          </div>
                        </div>
                        {beating && <p className="text-xs mt-1" style={{ color: "var(--success)" }}>Above network ↑</p>}
                        {behind && <p className="text-xs mt-1" style={{ color: "var(--warning)" }}>Below network ↓</p>}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </>
      )}
    </div>
    </>
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
