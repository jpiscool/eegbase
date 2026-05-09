import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clients, sessions, assignments, protocols, checkIns, clinicians, treatmentPlans, outcomeMeasures } from "@/lib/db/schema";
import { eq, and, desc, avg, count, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PrintButton } from "@/components/PrintButton";
import { ShareReportButton } from "@/components/ShareReportButton";

function fmtDuration(sec: number | null) {
  if (sec == null) return "—";
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

function scoreColor(v: number): string {
  if (v >= 70) return "#059669";
  if (v >= 40) return "#D97706";
  return "#DC2626";
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";

  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.clinicId, clinicId)))
    .limit(1);

  if (!client) notFound();

  const [clinician] = await db
    .select({ name: clinicians.name })
    .from(clinicians)
    .where(eq(clinicians.id, session!.user!.id!))
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
        preAnxiety: sessions.preAnxiety,
        postAnxiety: sessions.postAnxiety,
        notes: sessions.notes,
        postNotes: sessions.postNotes,
        aiSummary: sessions.aiSummary,
      })
      .from(sessions)
      .where(eq(sessions.clientId, id))
      .orderBy(desc(sessions.startedAt))
      .limit(50),
    db
      .select({ name: protocols.name, deviceType: protocols.deviceType })
      .from(assignments)
      .innerJoin(protocols, eq(assignments.protocolId, protocols.id))
      .where(and(eq(assignments.clientId, id), eq(assignments.active, true)))
      .limit(1),
    db
      .select({ avg: avg(sessions.avgRewardScore) })
      .from(sessions)
      .where(eq(sessions.clientId, id)),
    db
      .select({ count: count() })
      .from(sessions)
      .where(eq(sessions.clientId, id)),
    db
      .select()
      .from(checkIns)
      .where(eq(checkIns.clientId, id))
      .orderBy(desc(checkIns.date))
      .limit(10),
  ]);

  const [activePlan, rewardTimeline, outcomeMeasureHistory] = await Promise.all([
    db
      .select()
      .from(treatmentPlans)
      .where(and(eq(treatmentPlans.clientId, id), eq(treatmentPlans.status, "active")))
      .orderBy(desc(treatmentPlans.startDate))
      .limit(1),
    db
      .select({ startedAt: sessions.startedAt, avgRewardScore: sessions.avgRewardScore })
      .from(sessions)
      .where(and(eq(sessions.clientId, id)))
      .orderBy(asc(sessions.startedAt))
      .limit(30),
    db
      .select()
      .from(outcomeMeasures)
      .where(eq(outcomeMeasures.clientId, id))
      .orderBy(desc(outcomeMeasures.administeredAt))
      .limit(5),
  ]);

  const avgScore = rewardAvg[0]?.avg ? Number(rewardAvg[0].avg) : null;
  const protocol = activeAssignment[0] ?? null;
  const totalSessions = Number(totalCount[0]?.count ?? 0);
  const plan = activePlan[0] ?? null;

  // Questionnaire deltas
  const focusPairs = sessionList.filter((s) => s.preFocus != null && s.postFocus != null);
  const avgFocusDelta = focusPairs.length > 0 ? focusPairs.reduce((acc, s) => acc + (s.postFocus! - s.preFocus!), 0) / focusPairs.length : null;
  const moodPairs = sessionList.filter((s) => s.preMood != null && s.postMood != null);
  const avgMoodDelta = moodPairs.length > 0 ? moodPairs.reduce((a, s) => a + (s.postMood! - s.preMood!), 0) / moodPairs.length : null;
  const anxietyPairs = sessionList.filter((s) => s.preAnxiety != null && s.postAnxiety != null);
  const avgAnxietyDelta = anxietyPairs.length > 0 ? anxietyPairs.reduce((a, s) => a + (s.postAnxiety! - s.preAnxiety!), 0) / anxietyPairs.length : null;

  // Milestone badges
  type Milestone = { icon: string; label: string; color: string };
  const milestones: Milestone[] = [];
  if (totalSessions >= 5)  milestones.push({ icon: "⭐", label: "5 Sessions", color: "#F59E0B" });
  if (totalSessions >= 10) milestones.push({ icon: "🏅", label: "10 Sessions", color: "#D97706" });
  if (totalSessions >= 25) milestones.push({ icon: "🥇", label: "25 Sessions", color: "#B45309" });
  if (totalSessions >= 50) milestones.push({ icon: "🏆", label: "50 Sessions", color: "#92400E" });
  if (avgScore != null && avgScore >= 70) milestones.push({ icon: "🎯", label: "High Performer (avg ≥70%)", color: "#059669" });
  if (avgFocusDelta != null && avgFocusDelta >= 1) milestones.push({ icon: "🧠", label: "Focus Improved", color: "#2563EB" });
  if (avgAnxietyDelta != null && avgAnxietyDelta <= -1) milestones.push({ icon: "😌", label: "Anxiety Reduced", color: "#7C3AED" });
  if (checkInList.length >= 5) milestones.push({ icon: "📅", label: "5+ Check-Ins", color: "#0891B2" });

  // Reward sparkline (SVG path from timeline)
  const sparklineWidth = 240;
  const sparklineHeight = 40;
  let sparklinePath = "";
  if (rewardTimeline.length > 1) {
    const scores = rewardTimeline.map((r) => r.avgRewardScore ?? 0);
    const minS = Math.min(...scores);
    const maxS = Math.max(...scores, minS + 1);
    const pts = scores.map((s, i) => {
      const x = (i / (scores.length - 1)) * sparklineWidth;
      const y = sparklineHeight - ((s - minS) / (maxS - minS)) * sparklineHeight;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    });
    sparklinePath = pts.join(" ");
  }

  const reportDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const firstSession = sessionList[sessionList.length - 1]?.startedAt;
  const lastSession = sessionList[0]?.startedAt;
  const latestAiSummary = sessionList.find((s) => s.aiSummary)?.aiSummary ?? null;

  return (
    <>
      <style>{`
        @media print {
          nav, aside, [class*="sidebar"], [class*="Sidebar"] { display: none !important; }
          main { padding: 0 !important; width: 100% !important; max-width: 100% !important; }
          .no-print { display: none !important; }
          body { background: white !important; }
        }
        .report-back-link { color: var(--text-tertiary); }
        .report-back-link:hover { color: var(--text-primary); background: var(--surface-sunken); }
      `}</style>

      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        {/* Screen nav */}
        <div className="no-print mb-6">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <Link href={`/clients/${id}`} className="p-1.5 rounded-lg transition-colors report-back-link">
                <ArrowLeft size={18} />
              </Link>
              <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>Progress Report Preview</span>
            </div>
            <PrintButton />
          </div>
          <div className="rounded-xl p-4" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
            <div className="flex items-center justify-between gap-4 mb-2">
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Share Report</p>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Create a read-only link you can send to your client or their family.</p>
              </div>
            </div>
            <ShareReportButton clientId={id} initialToken={client.reportToken ?? null} />
          </div>
        </div>

        {/* Report card */}
        <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 16, padding: "40px 48px", fontFamily: "system-ui, -apple-system, sans-serif", fontSize: 13 }}>

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
              {client.email && <span>{client.email} · </span>}
              Protocol: {protocol?.name ?? "None"} · Added {new Date(client.createdAt).toLocaleDateString()}
            </div>
            {client.goals && (
              <div style={{ marginTop: 6, fontSize: 12, color: "#475569" }}><strong>Goals:</strong> {client.goals}</div>
            )}
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Total Sessions", val: String(totalSessions), sub: "", color: "#0F172A" },
              { label: "Avg Reward", val: avgScore != null ? avgScore.toFixed(1) : "—", sub: "/ 100", color: avgScore != null ? scoreColor(avgScore) : "#CBD5E1" },
              { label: "Focus Δ", val: avgFocusDelta == null ? "—" : `${avgFocusDelta > 0 ? "+" : ""}${avgFocusDelta.toFixed(1)}`, sub: "pre→post avg", color: avgFocusDelta == null ? "#CBD5E1" : avgFocusDelta > 0 ? "#059669" : avgFocusDelta < 0 ? "#DC2626" : "#0F172A" },
              { label: "Anxiety Δ", val: avgAnxietyDelta == null ? "—" : `${avgAnxietyDelta > 0 ? "+" : ""}${avgAnxietyDelta.toFixed(1)}`, sub: "lower = better", color: avgAnxietyDelta == null ? "#CBD5E1" : avgAnxietyDelta < 0 ? "#059669" : avgAnxietyDelta > 0 ? "#DC2626" : "#0F172A" },
            ].map(({ label, val, sub, color }) => (
              <div key={label} style={{ border: "1px solid #E2E8F0", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, color }}>{val}</div>
                {sub && <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 3 }}>{sub}</div>}
              </div>
            ))}
          </div>

          {/* Reward trend sparkline */}
          {sparklinePath && (
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, padding: "12px 16px", border: "1px solid #E2E8F0", borderRadius: 10 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 4 }}>Reward Score Trend</div>
                <div style={{ fontSize: 11, color: "#64748B" }}>{rewardTimeline.length} sessions tracked</div>
              </div>
              <svg width={sparklineWidth} height={sparklineHeight} style={{ flex: 1 }}>
                <path d={sparklinePath} fill="none" stroke="#2563EB" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            </div>
          )}

          {/* Milestone badges */}
          {milestones.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid #F1F5F9" }}>
                Milestones Achieved
              </div>
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
                {milestones.map((m) => (
                  <span key={m.label} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 20, border: `1px solid ${m.color}22`, background: `${m.color}11`, fontSize: 11, fontWeight: 600, color: m.color }}>
                    {m.icon} {m.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Treatment Plan summary */}
          {plan && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid #F1F5F9" }}>
                Treatment Plan
              </div>
              <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, padding: "12px 14px", fontSize: 12 }}>
                {plan.sessionFrequency && <span style={{ marginRight: 16, color: "#1E40AF" }}><strong>Frequency:</strong> {plan.sessionFrequency}</span>}
                {plan.targetSessionCount != null && (
                  <span style={{ marginRight: 16, color: "#1E40AF" }}>
                    <strong>Target:</strong> {totalSessions}/{plan.targetSessionCount} sessions ({Math.round((totalSessions / plan.targetSessionCount) * 100)}%)
                  </span>
                )}
                {plan.reviewDate && <span style={{ color: "#1E40AF" }}><strong>Review date:</strong> {new Date(plan.reviewDate).toLocaleDateString()}</span>}
                {plan.presentingConcerns && <p style={{ marginTop: 6, color: "#1E3A8A" }}><strong>Presenting concerns:</strong> {plan.presentingConcerns}</p>}
                {plan.goals && <p style={{ marginTop: 4, color: "#1E3A8A" }}><strong>Goals:</strong> {plan.goals}</p>}
              </div>
            </div>
          )}

          {/* Sessions table */}
          {sessionList.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid #F1F5F9" }}>
                Session History ({sessionList.length} shown)
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 11.5 }}>
                <thead>
                  <tr style={{ background: "#F8FAFC" }}>
                    {["Date", "Duration", "Avg Reward", "Pre Focus", "Post Focus", "Pre Mood", "Post Mood", "Client Notes", "Clinical Notes"].map((h) => (
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
                      <td style={{ padding: "6px 8px", color: "#94A3B8", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{s.postNotes ?? ""}</td>
                      <td style={{ padding: "6px 8px", color: "#64748B", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{s.notes ?? ""}</td>
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
                    {["Date", "Sleep h", "Sleep Q", "Mood", "Anxiety", "Focus", "Energy", "Notes"].map((h) => (
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
                      <td style={{ padding: "6px 8px", color: "#94A3B8" }}>{c.notes ?? ""}</td>
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

          {/* Clinical notes */}
          {client.notes && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid #F1F5F9" }}>Clinical Notes</div>
              <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "12px 14px", fontSize: 12, color: "#92400E", lineHeight: 1.6 }}>{client.notes}</div>
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: 32, paddingTop: 16, borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94A3B8" }}>
            <span>EEGBase · eegbase.com · neurofeedback clinical platform</span>
            <span>Confidential — For clinical use only</span>
          </div>
        </div>
      </div>
    </>
  );
}
