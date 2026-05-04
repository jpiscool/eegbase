import { db } from "@/lib/db";
import { t, type Lang } from "@/lib/i18n";
import { ShareLangToggle } from "@/components/ShareLangToggle";
import { clients, sessions, assignments, protocols, checkIns, clinicians, goals, sessionDataPoints, soapNotes } from "@/lib/db/schema";
import { eq, and, desc, avg, count, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";

function fmtDuration(sec: number | null) {
  if (sec == null) return "—";
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

function scoreColor(v: number): string {
  if (v >= 70) return "#059669";
  if (v >= 40) return "#D97706";
  return "#DC2626";
}

// ── Prefrontal Activation Trend helpers ────────────────────────────────────────

interface TrendPoint {
  sessionIndex: number;
  score: number;
}

function RewardTrendChart({ points }: { points: TrendPoint[] }) {
  if (points.length < 2) return null;
  const W = 480;
  const H = 90;
  const PAD = { top: 8, right: 12, bottom: 20, left: 32 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const scores = points.map((p) => p.score);
  const minVal = Math.max(0, Math.min(...scores) - 5);
  const maxVal = Math.min(100, Math.max(...scores) + 5);
  const range = maxVal - minVal || 1;

  const toX = (i: number) => PAD.left + (i / (points.length - 1)) * chartW;
  const toY = (v: number) => PAD.top + chartH - ((v - minVal) / range) * chartH;

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(p.score).toFixed(1)}`).join(" ");
  const areaD = `${pathD} L ${toX(points.length - 1).toFixed(1)} ${(PAD.top + chartH).toFixed(1)} L ${toX(0).toFixed(1)} ${(PAD.top + chartH).toFixed(1)} Z`;

  const trending = points[points.length - 1].score >= points[0].score;
  const lineColor = trending ? "#059669" : "#D97706";
  const areaColor = trending ? "rgba(5,150,105,0.10)" : "rgba(217,119,6,0.10)";

  // y-axis labels
  const yLabels = [minVal, (minVal + maxVal) / 2, maxVal].map((v) => Math.round(v));

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible", maxWidth: "100%" }}>
      {/* y-axis labels */}
      {yLabels.map((v, i) => {
        const y = toY(v);
        return (
          <g key={i}>
            <line x1={PAD.left - 4} y1={y} x2={W - PAD.right} y2={y} stroke="#E2E8F0" strokeWidth={0.8} strokeDasharray="3 3" />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize={8} fill="#94A3B8">{v}</text>
          </g>
        );
      })}
      {/* area fill */}
      <path d={areaD} fill={areaColor} />
      {/* line */}
      <path d={pathD} fill="none" stroke={lineColor} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {/* dots + x labels */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={toX(i)} cy={toY(p.score)} r={3} fill={lineColor} stroke="white" strokeWidth={1.5} />
          <text x={toX(i)} y={H - 4} textAnchor="middle" fontSize={8} fill="#94A3B8">S{p.sessionIndex}</text>
        </g>
      ))}
    </svg>
  );
}

export default async function SharedReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  const lang: Lang = sp.lang === "es" ? "es" : sp.lang === "sv" ? "sv" : "en";

  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.reportToken, token))
    .limit(1);

  if (!client) notFound();

  const [clinician] = await db
    .select({ name: clinicians.name })
    .from(clinicians)
    .where(eq(clinicians.id, client.clinicianId))
    .limit(1);

  const [sessionList, activeAssignment, rewardAvg, totalCount, checkInList, goalList] = await Promise.all([
    db
      .select({
        id: sessions.id,
        startedAt: sessions.startedAt,
        durationSeconds: sessions.durationSeconds,
        avgRewardScore: sessions.avgRewardScore,
        preFocus: sessions.preFocus,
        postFocus: sessions.postFocus,
        preMood: sessions.preMood,
        postMood: sessions.postMood,
        notes: sessions.notes,
        postNotes: sessions.postNotes,
        aiSummary: sessions.aiSummary,
      })
      .from(sessions)
      .where(eq(sessions.clientId, client.id))
      .orderBy(desc(sessions.startedAt))
      .limit(50),
    db
      .select({ name: protocols.name, deviceType: protocols.deviceType })
      .from(assignments)
      .innerJoin(protocols, eq(assignments.protocolId, protocols.id))
      .where(and(eq(assignments.clientId, client.id), eq(assignments.active, true)))
      .limit(1),
    db
      .select({ avg: avg(sessions.avgRewardScore) })
      .from(sessions)
      .where(eq(sessions.clientId, client.id)),
    db
      .select({ count: count() })
      .from(sessions)
      .where(eq(sessions.clientId, client.id)),
    db
      .select()
      .from(checkIns)
      .where(eq(checkIns.clientId, client.id))
      .orderBy(desc(checkIns.date))
      .limit(10),
    db
      .select({ id: goals.id, title: goals.title, status: goals.status, targetDate: goals.targetDate, completedAt: goals.completedAt })
      .from(goals)
      .where(eq(goals.clientId, client.id))
      .orderBy(goals.createdAt),
  ]);

  const avgScore = rewardAvg[0]?.avg ? Number(rewardAvg[0].avg) : null;
  const protocol = activeAssignment[0] ?? null;
  const totalSessions = Number(totalCount[0]?.count ?? 0);

  const focusPairs = sessionList.filter((s) => s.preFocus != null && s.postFocus != null);
  const avgFocusDelta =
    focusPairs.length > 0
      ? focusPairs.reduce((acc, s) => acc + (s.postFocus! - s.preFocus!), 0) / focusPairs.length
      : null;

  const reportDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const firstSession = sessionList[sessionList.length - 1]?.startedAt;
  const lastSession = sessionList[0]?.startedAt;
  const latestAiSummary = sessionList.find((s) => s.aiSummary)?.aiSummary ?? null;

  // ── Client first name (for personalised header) ───────────────────────────
  const clientFirstName = client.name.trim().split(/\s+/)[0];

  // ── Most recent SOAP note assessment ─────────────────────────────────────
  // Join sessions → soapNotes, pick the latest session that has a SOAP note.
  let latestSoapAssessment: string | null = null;
  {
    const soapRows = await db
      .select({ assessment: soapNotes.assessment, updatedAt: soapNotes.updatedAt })
      .from(soapNotes)
      .innerJoin(sessions, eq(soapNotes.sessionId, sessions.id))
      .where(eq(sessions.clientId, client.id))
      .orderBy(desc(sessions.startedAt))
      .limit(1);
    latestSoapAssessment = soapRows[0]?.assessment ?? null;
  }

  // ── Prefrontal Activation Trend data ──────────────────────────────────────────
  // Build reward trend from the last 10 sessions that have avgRewardScore
  const scoredSessions = [...sessionList]
    .reverse() // oldest first for the chart
    .filter((s) => s.avgRewardScore != null)
    .slice(-10);

  const trendPoints: TrendPoint[] = scoredSessions.map((s, i) => ({
    sessionIndex: i + 1,
    score: s.avgRewardScore!,
  }));

  // Query fNIRS data from the last 3 scored sessions
  let oxyHbLeft: number | null = null;
  let oxyHbRight: number | null = null;
  let hasFnirs = false;

  const last3Sessions = scoredSessions.slice(-3);
  if (last3Sessions.length > 0) {
    const sessionIds = last3Sessions.map((s) => s.id);
    const fnirsSummary = await db
      .select({
        avgOxyHbLeft: avg(sessionDataPoints.oxyHbLeft),
        avgOxyHbRight: avg(sessionDataPoints.oxyHbRight),
      })
      .from(sessionDataPoints)
      .where(inArray(sessionDataPoints.sessionId, sessionIds));

    const leftVal = fnirsSummary[0]?.avgOxyHbLeft ? Number(fnirsSummary[0].avgOxyHbLeft) : null;
    const rightVal = fnirsSummary[0]?.avgOxyHbRight ? Number(fnirsSummary[0].avgOxyHbRight) : null;

    if (leftVal != null && rightVal != null) {
      oxyHbLeft = leftVal;
      oxyHbRight = rightVal;
      hasFnirs = true;
    }
  }

  let bilateralLabel = "";
  let bilateralColor = "#334155";
  if (hasFnirs && oxyHbLeft != null && oxyHbRight != null) {
    if (oxyHbLeft > oxyHbRight + 0.05) {
      bilateralLabel = "Left-dominant prefrontal activation";
      bilateralColor = "#7C3AED";
    } else if (oxyHbRight > oxyHbLeft + 0.05) {
      bilateralLabel = "Right-dominant prefrontal activation";
      bilateralColor = "#2563EB";
    } else {
      bilateralLabel = "Bilateral balance";
      bilateralColor = "#059669";
    }
  }

  const overallAvg = trendPoints.length > 0
    ? trendPoints.reduce((a, b) => a + b.score, 0) / trendPoints.length
    : null;

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", padding: "32px 16px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Public notice banner */}
      <div style={{ maxWidth: 800, margin: "0 auto 16px" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <ShareLangToggle />
        </div>
        <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "#1D4ED8" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>This is a shared progress report. The link was provided by your clinician.</span>
        </div>
      </div>

      {/* Report card */}
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 16, padding: "40px 48px", fontSize: 13 }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, paddingBottom: 20, borderBottom: "2px solid #E2E8F0" }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em", color: "#0F172A" }}>
                EEG<span style={{ color: "#2563EB" }}>Base</span>
              </div>
              <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>Clinician Neurofeedback Platform</div>
            </div>
            <div style={{ textAlign: "right", fontSize: 11, color: "#64748B", lineHeight: 1.8 }}>
              <div style={{ fontWeight: 600, color: "#0F172A" }}>{clientFirstName}&apos;s Progress Report</div>
              <div>Generated {reportDate} · Confidential</div>
              {clinician && <div>Clinician: {clinician.name}</div>}
              {firstSession && lastSession && (
                <div>Period: {new Date(firstSession).toLocaleDateString()} – {new Date(lastSession).toLocaleDateString()}</div>
              )}
            </div>
          </div>

          {/* Client */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>{client.name}</div>
            <div style={{ fontSize: 12, color: "#64748B" }}>
              Protocol: {protocol?.name ?? "None"} · Added {new Date(client.createdAt).toLocaleDateString()}
            </div>
            {client.goals && (
              <div style={{ marginTop: 6, fontSize: 12, color: "#475569" }}><strong>Goals:</strong> {client.goals}</div>
            )}
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 28 }}>
            {[
              { label: t("shareSessions", lang), val: String(totalSessions), sub: "", color: "#0F172A" },
              { label: t("shareAvgReward", lang), val: avgScore != null ? avgScore.toFixed(1) : "—", sub: "/ 100", color: avgScore != null ? scoreColor(avgScore) : "#CBD5E1" },
              { label: "Focus Change", val: avgFocusDelta == null ? "—" : `${avgFocusDelta > 0 ? "+" : ""}${avgFocusDelta.toFixed(1)}`, sub: "pre→post avg", color: avgFocusDelta == null ? "#CBD5E1" : avgFocusDelta > 0 ? "#059669" : avgFocusDelta < 0 ? "#DC2626" : "#0F172A" },
              { label: "Device", val: protocol?.deviceType ?? "—", sub: "", color: "#0F172A" },
            ].map(({ label, val, sub, color }) => (
              <div key={label} style={{ border: "1px solid #E2E8F0", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, color }}>{val}</div>
                {sub && <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 3 }}>{sub}</div>}
              </div>
            ))}
          </div>

          {/* ── Prefrontal Activation Trend ────────────────────────────────────── */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid #EDE9FE" }}>
              Prefrontal Activation Trend
            </div>

            {trendPoints.length === 0 ? (
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "20px 16px", textAlign: "center" as const }}>
                <div style={{ fontSize: 12, color: "#94A3B8" }}>No fNIRS data yet</div>
                <div style={{ fontSize: 10, color: "#CBD5E1", marginTop: 4 }}>Reward scores will appear here once sessions are recorded with scored data.</div>
              </div>
            ) : (
              <>
                {/* SVG line chart */}
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "16px 16px 8px", marginBottom: 14 }}>
                  <RewardTrendChart points={trendPoints} />
                  <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 4 }}>
                    Reward score (0–100) across last {trendPoints.length} session{trendPoints.length !== 1 ? "s" : ""}
                    {trendPoints.length >= 2 && (
                      <span style={{ marginLeft: 8, fontWeight: 600, color: trendPoints[trendPoints.length - 1].score >= trendPoints[0].score ? "#059669" : "#D97706" }}>
                        {trendPoints[trendPoints.length - 1].score >= trendPoints[0].score ? "↑ Trending up" : "↓ Trending down"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ display: "grid", gridTemplateColumns: hasFnirs ? "1fr 1fr" : "1fr", gap: 12 }}>
                  {/* Avg activation */}
                  <div style={{ border: "1px solid #E2E8F0", borderRadius: 10, padding: "14px 16px" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 4 }}>Avg. prefrontal activation</div>
                    {overallAvg != null ? (
                      <>
                        <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, color: scoreColor(overallAvg) }}>{overallAvg.toFixed(1)}</div>
                        <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 3 }}>/ 100 reward score</div>
                      </>
                    ) : (
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#CBD5E1" }}>—</div>
                    )}
                  </div>

                  {/* Bilateral balance */}
                  {hasFnirs ? (
                    <div style={{ border: "1px solid #E2E8F0", borderRadius: 10, padding: "14px 16px" }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 4 }}>Bilateral Balance</div>
                      <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3, color: bilateralColor }}>{bilateralLabel}</div>
                      <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 4 }}>
                        OxyHb L: {oxyHbLeft!.toFixed(3)} μM · R: {oxyHbRight!.toFixed(3)} μM (last 3 sessions)
                      </div>
                    </div>
                  ) : (
                    <div style={{ border: "1px solid #E2E8F0", borderRadius: 10, padding: "14px 16px" }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 4 }}>Bilateral Balance</div>
                      <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.5 }}>fNIRS data not available for this client</div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Sessions table */}
          {sessionList.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid #F1F5F9" }}>
                Session History ({sessionList.length} shown)
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 11.5 }}>
                <thead>
                  <tr style={{ background: "#F8FAFC" }}>
                    {["Date", "Duration", "Avg Reward", "Pre Focus", "Post Focus", "Pre Mood", "Post Mood"].map((h) => (
                      <th key={h} style={{ textAlign: "left" as const, padding: "7px 8px", fontWeight: 600, color: "#64748B", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.04em", borderBottom: "1px solid #E2E8F0" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessionList.map((s, i) => (
                    <tr key={s.id} style={{ background: i % 2 === 0 ? "white" : "#FAFAFA" }}>
                      <td style={{ padding: "6px 8px", color: "#334155", whiteSpace: "nowrap" as const }}>{new Date(s.startedAt).toLocaleDateString()}</td>
                      <td style={{ padding: "6px 8px", color: "#64748B" }}>{fmtDuration(s.durationSeconds)}</td>
                      <td style={{ padding: "6px 8px" }}>
                        {s.avgRewardScore != null ? <span style={{ fontWeight: 600, color: scoreColor(s.avgRewardScore) }}>{s.avgRewardScore.toFixed(1)}</span> : "—"}
                      </td>
                      <td style={{ padding: "6px 8px", color: "#64748B" }}>{s.preFocus ?? "—"}</td>
                      <td style={{ padding: "6px 8px" }}>
                        {s.postFocus != null ? <span style={{ fontWeight: 600, color: s.preFocus != null ? (s.postFocus > s.preFocus ? "#059669" : s.postFocus < s.preFocus ? "#DC2626" : "#334155") : "#334155" }}>{s.postFocus}</span> : "—"}
                      </td>
                      <td style={{ padding: "6px 8px", color: "#64748B" }}>{s.preMood ?? "—"}</td>
                      <td style={{ padding: "6px 8px", color: "#64748B" }}>{s.postMood ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Clinician Notes (most recent SOAP note assessment) */}
          {latestSoapAssessment && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#0F172A", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid #E2E8F0" }}>
                Clinician Notes
              </div>
              <div style={{ border: "1px solid #E2E8F0", borderRadius: 10, padding: "16px 18px", background: "#FAFAFA" }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 8 }}>Assessment (most recent SOAP note)</div>
                <p style={{ fontSize: 12.5, color: "#334155", lineHeight: 1.7, margin: 0 }}>{latestSoapAssessment}</p>
              </div>
            </div>
          )}

          {/* Check-ins table */}
          {checkInList.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid #F1F5F9" }}>
                Daily Check-Ins (last {checkInList.length})
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 11.5 }}>
                <thead>
                  <tr style={{ background: "#F8FAFC" }}>
                    {["Date", "Sleep h", "Sleep Q", "Mood", "Anxiety", "Focus", "Energy"].map((h) => (
                      <th key={h} style={{ textAlign: "left" as const, padding: "7px 8px", fontWeight: 600, color: "#64748B", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.04em", borderBottom: "1px solid #E2E8F0" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {checkInList.map((c, i) => (
                    <tr key={c.id} style={{ background: i % 2 === 0 ? "white" : "#FAFAFA" }}>
                      <td style={{ padding: "6px 8px", color: "#334155", whiteSpace: "nowrap" as const }}>{new Date(c.date).toLocaleDateString()}</td>
                      <td style={{ padding: "6px 8px", color: "#64748B" }}>{c.sleepHours ?? "—"}</td>
                      <td style={{ padding: "6px 8px", color: "#64748B" }}>{c.sleepQuality ?? "—"}</td>
                      <td style={{ padding: "6px 8px", color: "#64748B" }}>{c.mood ?? "—"}</td>
                      <td style={{ padding: "6px 8px", color: "#64748B" }}>{c.anxiety ?? "—"}</td>
                      <td style={{ padding: "6px 8px", color: "#64748B" }}>{c.focus ?? "—"}</td>
                      <td style={{ padding: "6px 8px", color: "#64748B" }}>{c.energy ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Treatment Goals */}
          {goalList.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#059669", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid #D1FAE5" }}>
                {t("shareGoals", lang)}
              </div>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
                {goalList.map((g) => {
                  const achieved = g.status === "achieved";
                  const active = g.status === "active";
                  const isOverdue = active && g.targetDate != null && new Date(g.targetDate) < new Date();
                  return (
                    <div key={g.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", border: `1px solid ${achieved ? "#A7F3D0" : isOverdue ? "#FECACA" : "#E2E8F0"}`, borderRadius: 8, background: achieved ? "#F0FDF4" : isOverdue ? "#FFF5F5" : "#F8FAFC" }}>
                      <span style={{ fontSize: 14, marginTop: 1 }}>{achieved ? "✅" : active ? "🎯" : "⏸"}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: achieved ? "#065F46" : isOverdue ? "#991B1B" : "#0F172A", textDecoration: achieved ? "line-through" : "none" as const }}>{g.title}</div>
                        {g.targetDate && !achieved && (
                          <div style={{ fontSize: 10.5, color: isOverdue ? "#DC2626" : "#64748B", marginTop: 2 }}>
                            {isOverdue ? "⚠ Overdue · " : "Target: "}
                            {new Date(g.targetDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </div>
                        )}
                        {g.completedAt && (
                          <div style={{ fontSize: 10.5, color: "#059669", marginTop: 2 }}>
                            Achieved {new Date(g.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Clinical Insight */}
          {latestAiSummary && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid #EDE9FE" }}>✦ AI Clinical Insight (Claude)</div>
              <div style={{ background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 8, padding: "12px 14px", fontSize: 12, color: "#4C1D95", lineHeight: 1.7 }}>{latestAiSummary}</div>
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: 32, paddingTop: 16, borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94A3B8" }}>
            <span>EEGBase · eegbase.com · Open-source neurofeedback platform</span>
            <span>{t("shareFooter", lang)}</span>
          </div>
        </div>

        {/* Powered by footer */}
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "#94A3B8" }}>
          Powered by <strong>EEGBase</strong> — the open-source neurofeedback platform
        </div>
      </div>
    </div>
  );
}
