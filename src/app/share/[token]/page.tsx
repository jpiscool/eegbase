import { db } from "@/lib/db";
import { clients, sessions, assignments, protocols, checkIns, clinicians } from "@/lib/db/schema";
import { eq, and, desc, avg, count } from "drizzle-orm";
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

export default async function SharedReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

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

  const [sessionList, activeAssignment, rewardAvg, totalCount, checkInList] = await Promise.all([
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

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", padding: "32px 16px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Public notice banner */}
      <div style={{ maxWidth: 800, margin: "0 auto 16px" }}>
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
              <div style={{ fontWeight: 600, color: "#0F172A" }}>Progress Report</div>
              <div>Generated {reportDate}</div>
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
              { label: "Total Sessions", val: String(totalSessions), sub: "", color: "#0F172A" },
              { label: "Avg Reward", val: avgScore != null ? avgScore.toFixed(1) : "—", sub: "/ 100", color: avgScore != null ? scoreColor(avgScore) : "#CBD5E1" },
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
            <span>Confidential — For clinical use only</span>
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
