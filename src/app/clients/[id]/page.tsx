import React from "react";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clients, sessions, assignments, protocols, goals, cptResults, erpResults } from "@/lib/db/schema";
import { eq, and, desc, avg, count } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, MessageSquare, ClipboardList, FileText, Download, Target, Brain, Activity, BarChart2, TrendingUp, TrendingDown, GitBranch, MoreHorizontal, ChevronDown, Lightbulb, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { AssignProtocolModal } from "@/components/AssignProtocolModal";
import { TrendChart } from "@/components/TrendChart";
import { SessionMetricTrend } from "@/components/SessionMetricChart";
import { EditClientModal } from "@/components/EditClientModal";
import { ToggleClientActiveButton } from "@/components/ToggleClientActiveButton";
import { SessionHeatmap } from "@/components/SessionHeatmap";
import { ClientProgressPanel } from "@/components/ClientProgressPanel";
import { logAuditEvent } from "@/lib/audit";

// ── AI Protocol Recommendation Panel ─────────────────────────────────────────
async function ProtocolRecommendations({
  sessions,
  currentProtocol,
  clientId,
}: {
  sessions: Array<{ avgRewardScore: number | null; startedAt: Date }>;
  currentProtocol: string | null;
  clientId: string;
}) {
  type Priority = "High" | "Medium" | "Insight";
  type Recommendation = {
    icon: React.ReactNode;
    title: string;
    body: string;
    priority: Priority;
    actionLabel?: string;
    actionHref?: string;
  };

  const recommendations: Recommendation[] = [];
  const now = new Date();

  // Sorted oldest → newest (sessions prop comes in desc order)
  const orderedSessions = [...sessions].reverse();
  const total = orderedSessions.length;

  // Helper: mean
  function mean(vals: number[]): number {
    return vals.length === 0 ? 0 : vals.reduce((a, b) => a + b, 0) / vals.length;
  }
  // Helper: std dev
  function stdDev(vals: number[]): number {
    if (vals.length < 2) return 0;
    const m = mean(vals);
    return Math.sqrt(vals.reduce((s, v) => s + (v - m) ** 2, 0) / vals.length);
  }

  // Rule 4 (guard): < 5 sessions total — show only this and return early
  if (total < 5) {
    recommendations.push({
      icon: <Lightbulb size={15} />,
      title: "More Data Needed",
      body: "Complete at least 5 sessions to unlock personalized protocol recommendations.",
      priority: "Insight",
    });
    return renderPanel(recommendations, clientId);
  }

  // Extract reward scores (only non-null values)
  const allScores = orderedSessions
    .map((s) => s.avgRewardScore)
    .filter((v): v is number => v !== null);

  const last3Scores = allScores.slice(-3);
  const last5Scores = allScores.slice(-5);

  // Rule 1: last 3 avg < 50
  if (last3Scores.length === 3 && mean(last3Scores) < 50) {
    recommendations.push({
      icon: <TrendingDown size={15} />,
      title: "Low Recent Performance",
      body: "Consider lowering the reward threshold to build confidence before increasing difficulty.",
      priority: "High",
      actionLabel: "Adjust Protocol",
      actionHref: `#protocol-section`,
    });
  }

  // Rule 5: declining trend — each of last 3 lower than previous
  if (last3Scores.length === 3) {
    const [a, b, c] = last3Scores;
    if (b < a && c < b) {
      recommendations.push({
        icon: <TrendingDown size={15} />,
        title: "Declining Trend Detected",
        body: "Declining trend detected. Consider a protocol adjustment, scheduling a check-in call, or reviewing the client's recent check-ins.",
        priority: "High",
        actionLabel: "Send Message",
        actionHref: `/clients/${clientId}/messages`,
      });
    }
  }

  // Rule 6: last session > 14 days ago
  if (sessions.length > 0) {
    const lastSessionDate = new Date(sessions[0].startedAt);
    const daysSince = Math.floor((now.getTime() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince > 14) {
      recommendations.push({
        icon: <Clock size={15} />,
        title: "Session Gap Detected",
        body: `Client hasn't had a session in 14+ days (last session was ${daysSince} days ago). Consider sending a check-in message.`,
        priority: "Medium",
        actionLabel: "Send Message",
        actionHref: `/clients/${clientId}/messages`,
      });
    }
  }

  // Rule 3: high variance (std dev > 20) across last 5 sessions
  if (last5Scores.length === 5 && stdDev(last5Scores) > 20) {
    recommendations.push({
      icon: <AlertCircle size={15} />,
      title: "High Session Variability",
      body: "High session variability detected. Review pre-session questionnaire data for lifestyle factors (sleep, stress) affecting performance.",
      priority: "Medium",
      actionLabel: "View Check-Ins",
      actionHref: `/clients/${clientId}/checkins`,
    });
  }

  // Rule 2: last 5 avg > 75 AND trending up
  if (last5Scores.length === 5 && mean(last5Scores) > 75) {
    const [a, b, c, d, e] = last5Scores;
    const trendingUp = b > a && c > b && (d > c || e > d);
    if (trendingUp) {
      recommendations.push({
        icon: <TrendingUp size={15} />,
        title: "Strong Upward Trend",
        body: "Client is performing well. Consider increasing protocol difficulty or duration.",
        priority: "Insight",
        actionLabel: "Adjust Protocol",
        actionHref: `#protocol-section`,
      });
    }
  }

  // Rule 7: overall avg > 70 AND total sessions > 15
  if (allScores.length > 0 && mean(allScores) > 70 && total > 15) {
    recommendations.push({
      icon: <TrendingUp size={15} />,
      title: "Excellent Progress",
      body: "Excellent progress! Client may be ready for advanced protocol or maintenance phase.",
      priority: "Insight",
    });
  }

  return renderPanel(recommendations, clientId);
}

function renderPanel(
  recommendations: Array<{
    icon: React.ReactNode;
    title: string;
    body: string;
    priority: "High" | "Medium" | "Insight";
    actionLabel?: string;
    actionHref?: string;
  }>,
  _clientId: string,
) {
  // Priority order: High first, then Medium, then Insight
  const priorityOrder: Record<string, number> = { High: 0, Medium: 1, Insight: 2 };
  const sorted = [...recommendations].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
  );
  const shown = sorted.slice(0, 3);

  const priorityStyles: Record<string, React.CSSProperties> = {
    High: { background: "var(--danger-subtle)", color: "var(--danger)", borderColor: "color-mix(in srgb, var(--danger) 25%, transparent)" },
    Medium: { background: "var(--warning-subtle)", color: "var(--warning)", borderColor: "color-mix(in srgb, var(--warning) 25%, transparent)" },
    Insight: { background: "var(--brand-subtle)", color: "var(--brand)", borderColor: "color-mix(in srgb, var(--brand) 25%, transparent)" },
  };

  return (
    <div
      id="protocol-recommendations"
      className="rounded-xl border p-5 mb-6"
      style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb size={15} style={{ color: "var(--brand)" }} />
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Protocol Recommendations
        </h2>
        <span
          className="text-xs px-1.5 py-0.5 rounded font-medium"
          style={{ background: "var(--brand-subtle)", color: "var(--brand)" }}
        >
          Rule-based
        </span>
      </div>

      {shown.length === 0 ? (
        <div className="flex items-center gap-2.5 py-2" style={{ color: "var(--success)" }}>
          <CheckCircle2 size={15} />
          <p className="text-sm">
            All looks good! No protocol adjustments suggested at this time.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {shown.map((rec, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3.5 rounded-xl border"
              style={{ background: "var(--surface-sunken)", borderColor: "var(--border-subtle)" }}
            >
              {/* Icon */}
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={priorityStyles[rec.priority]}
              >
                <span style={{ color: priorityStyles[rec.priority].color as string }}>{rec.icon}</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {rec.title}
                  </span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full border font-medium"
                    style={priorityStyles[rec.priority]}
                  >
                    {rec.priority}
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {rec.body}
                </p>
                {rec.actionLabel && rec.actionHref && (
                  <Link
                    href={rec.actionHref}
                    className="inline-flex items-center gap-1 mt-2 text-xs font-semibold transition-colors hover:underline"
                    style={{ color: "var(--brand)" }}
                  >
                    {rec.actionLabel} →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function ClientDetailPage({
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

  // HIPAA: a clinician opening a client chart counts as a PHI view event.
  // Fire-and-forget so audit failures never break the page render.
  void logAuditEvent({
    clinicId,
    clinicianId: session?.user?.id,
    clinicianName: (session?.user as { name?: string })?.name,
    action: "client.viewed",
    resourceType: "client",
    resourceId: client.id,
    resourceLabel: client.name,
  });

  const [sessionList, activeAssignment, protocolList, avgReward, totalSessionsRow, activeGoals] = await Promise.all([
    db
      .select({
        id: sessions.id,
        startedAt: sessions.startedAt,
        durationSeconds: sessions.durationSeconds,
        avgRewardScore: sessions.avgRewardScore,
        deviceType: sessions.deviceType,
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
      .where(eq(sessions.clientId, id))
      .orderBy(desc(sessions.startedAt))
      .limit(50),
    db
      .select({ protocol: protocols })
      .from(assignments)
      .innerJoin(protocols, eq(assignments.protocolId, protocols.id))
      .where(and(eq(assignments.clientId, id), eq(assignments.active, true)))
      .limit(1),
    db
      .select({ id: protocols.id, name: protocols.name, deviceType: protocols.deviceType })
      .from(protocols)
      .where(eq(protocols.clinicId, clinicId))
      .orderBy(protocols.name),
    db
      .select({ avg: avg(sessions.avgRewardScore) })
      .from(sessions)
      .where(eq(sessions.clientId, id)),
    db
      .select({ count: count() })
      .from(sessions)
      .where(eq(sessions.clientId, id)),
    db
      .select({ id: goals.id, title: goals.title, status: goals.status, targetDate: goals.targetDate })
      .from(goals)
      .where(and(eq(goals.clientId, id), eq(goals.status, "active")))
      .orderBy(goals.targetDate)
      .limit(3),
  ]);

  // CPT history (last 5 assessments)
  const [cptHistory, erpHistory] = await Promise.all([
    db.select().from(cptResults).where(eq(cptResults.clientId, id)).orderBy(desc(cptResults.administeredAt)).limit(5),
    db.select().from(erpResults).where(eq(erpResults.clientId, id)).orderBy(desc(erpResults.administeredAt)).limit(5),
  ]);

  const assignedProtocol = activeAssignment[0]?.protocol ?? null;
  const overallAvg = avgReward[0]?.avg ? Number(avgReward[0].avg).toFixed(1) : null;
  const totalSessions = Number(totalSessionsRow[0]?.count ?? 0);

  // Attendance stats
  const now = new Date();
  const lastSessionDays =
    sessionList.length > 0
      ? Math.floor((now.getTime() - new Date(sessionList[0].startedAt).getTime()) / (1000 * 60 * 60 * 24))
      : null;

  // Weekly streak: count consecutive calendar weeks (Mon-start) ending at the current week that have ≥1 session
  function isoWeek(d: Date) {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return { year: t.getUTCFullYear(), week: Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7) };
  }
  const weeksWithSessions = new Set(
    sessionList.map((s) => {
      const w = isoWeek(new Date(s.startedAt));
      return `${w.year}-${w.week}`;
    })
  );
  let streak = 0;
  for (let i = 0; i < 52; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const w = isoWeek(d);
    if (weeksWithSessions.has(`${w.year}-${w.week}`)) {
      streak++;
    } else {
      break;
    }
  }
  // Avg sessions per week over last 8 weeks
  const eightWeeksAgo = new Date(now);
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
  const recentSessions = sessionList.filter((s) => new Date(s.startedAt) >= eightWeeksAgo);
  const avgPerWeek = recentSessions.length > 0 ? (recentSessions.length / 8).toFixed(1) : null;

  // ── Goal Milestone Badges ────────────────────────────────────────────────────
  const milestones: { icon: string; label: string; desc: string; earned: boolean }[] = [
    { icon: "🎯", label: "First Session",   desc: "Completed 1st session",     earned: totalSessions >= 1 },
    { icon: "🔥", label: "On a Roll",        desc: "5 sessions completed",       earned: totalSessions >= 5 },
    { icon: "⭐", label: "10 Sessions",      desc: "10 sessions milestone",      earned: totalSessions >= 10 },
    { icon: "💎", label: "25 Sessions",      desc: "25 sessions milestone",      earned: totalSessions >= 25 },
    { icon: "🏆", label: "50 Sessions",      desc: "50 sessions milestone",      earned: totalSessions >= 50 },
    { icon: "📅", label: "Consistent",       desc: "3-week streak",              earned: streak >= 3 },
    { icon: "🌊", label: "Flow State",       desc: "2-month streak",             earned: streak >= 8 },
    { icon: "🧠", label: "High Performer",   desc: "Avg reward ≥ 70",            earned: overallAvg != null && Number(overallAvg) >= 70 },
    { icon: "✨", label: "Peak Performer",   desc: "Avg reward ≥ 85",            earned: overallAvg != null && Number(overallAvg) >= 85 },
  ];
  const earnedBadges = milestones.filter((m) => m.earned);
  const nextBadge = milestones.find((m) => !m.earned);

  // ── Protocol Recommendation Engine ──────────────────────────────────────────
  const clientText = ((client.notes ?? "") + " " + (client.goals ?? "")).toLowerCase();
  const RULES = [
    {
      keywords: ["adhd", "attention", "concentration", "hyperactive", "impulsive", "focus"],
      label: "SMR / Beta Training",
      rationale: "Sensorimotor rhythm (SMR) and beta uptraining are the most-studied protocols for attention regulation. Target: C3/Cz/C4, reward 12–15 Hz.",
      icon: "⚡",
    },
    {
      keywords: ["anxiety", "stress", "worry", "panic", "calm", "relax"],
      label: "Alpha / Theta Downtraining",
      rationale: "Alpha uptraining (8–12 Hz) promotes calm alertness and reduces cortical hyperarousal associated with anxiety. Inhibit high-beta (>25 Hz).",
      icon: "🌊",
    },
    {
      keywords: ["sleep", "insomnia", "fatigue", "tired", "rest"],
      label: "Theta / Delta Protocol",
      rationale: "Theta (4–8 Hz) uptraining supports sleep onset. Combine with frontal alpha asymmetry training for sustained effect.",
      icon: "🌙",
    },
    {
      keywords: ["trauma", "ptsd", "dissociation", "freeze", "flashback"],
      label: "Alpha-Theta Deep State",
      rationale: "Alpha-theta crossover training (Peniston-Kulkosky protocol) is the most-researched approach for PTSD and trauma-related presentations.",
      icon: "🛡️",
    },
    {
      keywords: ["depression", "mood", "sad", "hopeless", "low energy", "motivation"],
      label: "Frontal Alpha Asymmetry",
      rationale: "Right hemisphere alpha uptraining (F4) with left hemisphere alpha inhibition targets the asymmetry pattern associated with depressive mood.",
      icon: "🧠",
    },
    {
      keywords: ["tbi", "brain injury", "concussion", "headache", "migraine", "cognitive"],
      label: "LORETA / Z-score Training",
      rationale: "Z-score neurofeedback against normative database (LORETA) is indicated for TBI and acquired cognitive deficits where deviations from norms are documented.",
      icon: "🔬",
    },
  ];
  const matchedRules = RULES.filter((r) => r.keywords.some((k) => clientText.includes(k)));
  // Fill with generic if fewer than 2 matches
  const defaultRec = {
    label: "Frontal Theta Coherence",
    rationale: "A versatile first-line protocol for general mental wellness. Theta coherence training (F3-F4) supports executive function and emotional regulation.",
    icon: "🎯",
  };
  const protocolRecs = matchedRules.length > 0 ? matchedRules.slice(0, 3) : [defaultRec];
  // Cross-reference with existing clinic protocols by name
  const matchedProtocols = protocolRecs.map((rec) => {
    const match = protocolList.find((p) =>
      rec.label.toLowerCase().split(" ").some((w) => w.length > 3 && p.name.toLowerCase().includes(w))
    );
    return { ...rec, existingProtocol: match ?? null };
  });

  // Build trend data for chart (oldest → newest, max 30 sessions)
  const trendData = [...sessionList]
    .reverse()
    .slice(-30)
    .map((s) => ({ score: s.avgRewardScore ?? null, date: s.startedAt }));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/clients"
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: "var(--text-tertiary)" }}
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{client.name}</h1>
            <EditClientModal
              client={{
                id: client.id,
                name: client.name,
                email: client.email ?? null,
                notes: client.notes ?? null,
                goals: client.goals ?? null,
                dateOfBirth: client.dateOfBirth ?? null,
                referralSource: client.referralSource ?? null,
              }}
            />
          </div>
          <p className="text-sm flex items-center gap-3" style={{ color: "var(--text-tertiary)" }}>
            <span>
              {client.email ?? "No email"} · Added {new Date(client.createdAt).toLocaleDateString()}
              {client.dateOfBirth && (() => {
                const dob = new Date(client.dateOfBirth!);
                const ageDiff = Date.now() - dob.getTime();
                const age = Math.floor(ageDiff / (365.25 * 24 * 60 * 60 * 1000));
                return ` · Age ${age}`;
              })()}
            </span>
            {!client.active && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full border" style={{ background: "var(--danger-subtle)", color: "var(--danger)", borderColor: "color-mix(in srgb, var(--danger) 25%, transparent)" }}>
                Inactive
              </span>
            )}
          </p>
          <div className="mt-1">
            <ToggleClientActiveButton clientId={client.id} active={client.active} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* More Actions dropdown (HTML-native details/summary) */}
          <details className="relative">
            <summary
              className="flex items-center gap-1.5 px-4 py-2 border text-sm font-medium rounded-lg transition-colors cursor-pointer list-none select-none"
              style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)", background: "var(--surface-raised)" }}
            >
              <MoreHorizontal size={14} />
              More Actions
              <ChevronDown size={12} />
            </summary>
            <div
              className="absolute right-0 top-full mt-1 w-52 rounded-xl border overflow-hidden z-20 py-1"
              style={{ background: "var(--surface-overlay)", borderColor: "var(--border-default)", boxShadow: "var(--shadow-lg)" }}
            >
              {[
                { href: `/api/clients/${id}/export`, download: true, icon: <Download size={14} />, label: "Export CSV", asAnchor: true },
                { href: `/clients/${id}/report`, icon: <FileText size={14} />, label: "Print Report" },
                {
                  // Email report — mirrors Phase 24 from the demo. mailto: opens the
                  // clinician's email client with a sensible pre-filled draft so they
                  // can attach the PDF report (downloaded via Print Report) and send.
                  href: `mailto:${client.email ?? ""}?subject=${encodeURIComponent(`Your session report — ${client.name}`)}&body=${encodeURIComponent(`Hi ${client.name.split(" ")[0]},\n\nAttached is your latest session report. Let me know if you'd like to discuss anything in our next visit.\n\nBest,\n`)}`,
                  icon: <FileText size={14} />,
                  label: "Email report",
                  asAnchor: true,
                },
                { href: `/clients/${id}/intake`, icon: <Brain size={14} />, label: "Intake Form" },
                { href: `/clients/${id}/erp`, icon: <Activity size={14} />, label: "ERP Assessment" },
                { href: `/clients/${id}/cpt`, icon: <BarChart2 size={14} />, label: "CPT Assessment" },
                { href: `/clients/${id}/outcomes`, icon: <BarChart2 size={14} />, label: "Outcomes" },
                { href: `/clients/${id}/progress`, icon: <TrendingUp size={14} />, label: "Progress PDF" },
              ].map((item) =>
                "asAnchor" in item ? (
                  <a
                    key={item.href}
                    href={item.href}
                    {...("download" in item && item.download ? { download: true } : {})}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {item.icon} {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {item.icon} {item.label}
                  </Link>
                )
              )}
            </div>
          </details>

          {/* Primary CTA */}
          <Link
            href={`/sessions/live?clientId=${id}${assignedProtocol ? `&protocolId=${assignedProtocol.id}` : ""}`}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors"
            style={{ background: "var(--brand)", color: "var(--text-inverse)" }}
          >
            <Play size={14} />
            Start Session
          </Link>
        </div>
      </div>

      {/* ── Tab strip ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-0.5 border-b mb-6" style={{ borderColor: "var(--border-subtle)" }}>
        {[
          { href: `/clients/${id}/timeline`, icon: <GitBranch size={13} />, label: "Timeline" },
          { href: `/clients/${id}/treatment-plan`, icon: <ClipboardList size={13} />, label: "Treatment Plan" },
          { href: `/clients/${id}/goals`, icon: <Target size={13} />, label: "Goals" },
          { href: `/clients/${id}/checkins`, icon: <ClipboardList size={13} />, label: "Check-Ins" },
          { href: `/clients/${id}/messages`, icon: <MessageSquare size={13} />, label: "Messages" },
        ].map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 border-transparent -mb-px"
            style={{ color: "var(--text-secondary)" }}
          >
            {tab.icon} {tab.label}
          </Link>
        ))}
      </div>

      {/* ── Quick actions ribbon ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {[
          { href: `/sessions/live?clientId=${id}${assignedProtocol ? `&protocolId=${assignedProtocol.id}` : ""}`, icon: <Play size={13} />, label: "Start Session", primary: true },
          { href: `/clients/${id}/messages`, icon: <MessageSquare size={13} />, label: "Message" },
          { href: `/clients/${id}/checkins`, icon: <ClipboardList size={13} />, label: "Check-Ins" },
          { href: `/clients/${id}/goals`, icon: <Target size={13} />, label: "Goals" },
          { href: `/clients/${id}/cpt`, icon: <BarChart2 size={13} />, label: "CPT Test" },
          { href: `/clients/${id}/erp`, icon: <Activity size={13} />, label: "ERP" },
          { href: `/clients/${id}/report`, icon: <FileText size={13} />, label: "Report" },
          { href: `/clients/${id}/timeline`, icon: <GitBranch size={13} />, label: "Timeline" },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
            style={action.primary
              ? { background: "var(--brand)", color: "var(--text-inverse)", borderColor: "var(--brand)" }
              : { background: "var(--surface-raised)", color: "var(--text-secondary)", borderColor: "var(--border-default)" }}
          >
            {action.icon}
            {action.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-4 mb-6">
        {/* Stats row */}
        <div className="rounded-xl border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)" }}>Total Sessions</p>
          <p className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{totalSessions}</p>
        </div>
        <div className="rounded-xl border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)" }}>Avg Reward</p>
          <p className="text-3xl font-bold" style={{
            color: overallAvg == null ? "var(--text-primary)"
              : Number(overallAvg) >= 70 ? "var(--success)"
              : Number(overallAvg) >= 40 ? "var(--warning)"
              : "var(--danger)"
          }}>{overallAvg ?? "—"}</p>
        </div>
        <div className="rounded-xl border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)" }}>Weekly Streak</p>
          <p className="text-3xl font-bold" style={{ color: streak >= 3 ? "var(--success)" : "var(--text-primary)" }}>
            {streak > 0 ? streak : "—"}
            {streak > 0 && <span className="text-base font-normal ml-1" style={{ color: "var(--text-tertiary)" }}>wks</span>}
          </p>
        </div>
        <div className="rounded-xl border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)" }}>Avg / Week</p>
          <p className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
            {avgPerWeek ?? "—"}
            {avgPerWeek && <span className="text-base font-normal ml-1" style={{ color: "var(--text-tertiary)" }}>sess</span>}
          </p>
          {avgPerWeek && <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>last 8 weeks</p>}
        </div>
        <div className="rounded-xl border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)" }}>Last Session</p>
          <p className="text-3xl font-bold" style={{
            color: lastSessionDays == null ? "var(--text-primary)"
              : lastSessionDays <= 7 ? "var(--success)"
              : lastSessionDays <= 14 ? "var(--warning)"
              : "var(--danger)"
          }}>
            {lastSessionDays === null ? "—" : lastSessionDays === 0 ? "Today" : lastSessionDays === 1 ? "1" : lastSessionDays}
            {lastSessionDays != null && lastSessionDays > 1 && (
              <span className="text-base font-normal ml-1" style={{ color: "var(--text-tertiary)" }}>d ago</span>
            )}
          </p>
        </div>
      </div>

      {/* Assigned Protocol (separated from stat grid) */}
      <div className="rounded-xl border p-5 mb-6 flex items-center justify-between" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--text-tertiary)" }}>Assigned Protocol</p>
          <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{assignedProtocol?.name ?? "None assigned"}</p>
        </div>
        <AssignProtocolModal
          clientId={id}
          protocols={protocolList}
          currentProtocolId={assignedProtocol?.id ?? null}
        />
      </div>

      {/* AI Protocol Recommendation Panel */}
      <ProtocolRecommendations
        sessions={sessionList.map((s) => ({
          avgRewardScore: s.avgRewardScore,
          startedAt: new Date(s.startedAt),
        }))}
        currentProtocol={assignedProtocol?.name ?? null}
        clientId={id}
      />

      {/* Milestone Badges */}
      {totalSessions > 0 && (
        <div className="rounded-xl border p-5 mb-6" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Milestones</h2>
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{earnedBadges.length}/{milestones.length} earned</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {milestones.map((m) => (
              <div
                key={m.label}
                title={m.desc}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                style={m.earned
                  ? { background: "var(--warning-subtle)", borderColor: "var(--warning-muted)", color: "var(--warning)" }
                  : { background: "var(--surface-sunken)", borderColor: "var(--border-subtle)", color: "var(--text-tertiary)" }}
              >
                <span>{m.icon}</span>
                <span>{m.label}</span>
              </div>
            ))}
          </div>
          {nextBadge && (
            <p className="text-xs mt-2" style={{ color: "var(--text-tertiary)" }}>
              Next: <span style={{ color: "var(--text-secondary)" }} className="font-medium">{nextBadge.label}</span> — {nextBadge.desc}
            </p>
          )}
        </div>
      )}

      {/* Protocol Recommendations */}
      {(client.notes || client.goals) && protocolRecs.length > 0 && (
        <div className="rounded-xl border p-5 mb-6" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={15} style={{ color: "var(--brand)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Suggested Protocols</h2>
            <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: "var(--brand-subtle)", color: "var(--brand)" }}>
              AI
            </span>
          </div>
          <p className="text-xs mb-3" style={{ color: "var(--text-tertiary)" }}>
            Based on client notes and goals. Always apply clinical judgment before selecting a protocol.
          </p>
          <div className="flex flex-col gap-2">
            {matchedProtocols.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "var(--surface-sunken)" }}>
                <span className="text-lg shrink-0">{rec.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{rec.label}</span>
                    {rec.existingProtocol && (
                      <Link
                        href={`/protocols/${rec.existingProtocol.id}`}
                        className="text-xs px-1.5 py-0.5 rounded font-medium"
                        style={{ background: "var(--success-subtle)", color: "var(--success)" }}
                      >
                        ✓ {rec.existingProtocol.name} in library
                      </Link>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{rec.rationale}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trend chart */}
      {trendData.length > 1 && (
        <div className="rounded-xl border p-6 mb-6" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-secondary)" }}>
            Reward Score Trend · Last {trendData.length} sessions
          </h2>
          <TrendChart data={trendData} />
        </div>
      )}

      {/* Session attendance heatmap */}
      {sessionList.length > 0 && (
        <div className="rounded-xl border p-6 mb-6" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-secondary)" }}>
            Session Attendance · Last 16 weeks
          </h2>
          <SessionHeatmap sessionDates={sessionList.map((s) => new Date(s.startedAt))} />
        </div>
      )}

      {/* Pre/Post metric trend charts */}
      {sessionList.some((s) => s.preFocus != null || s.postFocus != null || s.preMood != null || s.preAnxiety != null) && (
        <div className="rounded-xl border p-6 mb-6" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-secondary)" }}>
            Symptom Tracking · Pre vs Post Session
          </h2>
          <SessionMetricTrend
            sessions={sessionList.map((s) => ({
              date: new Date(s.startedAt),
              preFocus: s.preFocus ?? null,
              postFocus: s.postFocus ?? null,
              preMood: s.preMood ?? null,
              postMood: s.postMood ?? null,
              preAnxiety: s.preAnxiety ?? null,
              postAnxiety: s.postAnxiety ?? null,
              preEnergy: s.preEnergy ?? null,
              postEnergy: s.postEnergy ?? null,
            }))}
          />
        </div>
      )}

      {/* Active goals mini-panel */}
      {activeGoals.length > 0 && (
        <div className="rounded-xl border overflow-hidden mb-6" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center gap-2">
              <Target size={14} style={{ color: "var(--success)" }} />
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Active Goals</h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--success-subtle)", color: "var(--success)" }}>{activeGoals.length}</span>
            </div>
            <Link href={`/clients/${id}/goals`} className="text-xs font-medium transition-colors" style={{ color: "var(--success)" }}>
              Manage →
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
            {activeGoals.map((g) => {
              const isOverdue = g.targetDate != null && new Date(g.targetDate) < new Date();
              return (
                <div key={g.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--success)" }} />
                  <p className="text-sm flex-1 truncate" style={{ color: "var(--text-primary)" }}>{g.title}</p>
                  {g.targetDate && (
                    <span className="text-xs shrink-0 font-medium" style={{ color: isOverdue ? "var(--danger)" : "var(--text-tertiary)" }}>
                      {isOverdue ? "Overdue · " : ""}{new Date(g.targetDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI progress summary */}
      <ClientProgressPanel
        clientId={id}
        initialSummary={client.aiSummary ?? null}
        initialUpdatedAt={client.aiSummaryUpdatedAt ?? null}
      />

      {/* Session history */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Session History</h2>
        </div>
        {sessionList.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
            No sessions yet.{" "}
            <Link href={`/sessions/live?clientId=${id}`} style={{ color: "var(--brand)" }} className="hover:underline">
              Start the first session.
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b" style={{ background: "var(--surface-sunken)", borderColor: "var(--border-subtle)" }}>
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Date</th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Duration</th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Avg Reward</th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Device</th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Pre→Post Focus</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
              {sessionList.map((s) => (
                <tr key={s.id} className="transition-colors">
                  <td className="px-6 py-3.5 font-medium" style={{ color: "var(--text-primary)" }}>
                    {new Date(s.startedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3.5" style={{ color: "var(--text-secondary)" }}>
                    {s.durationSeconds != null
                      ? `${Math.floor(s.durationSeconds / 60)}m ${s.durationSeconds % 60}s`
                      : "—"}
                  </td>
                  <td className="px-6 py-3.5">
                    {s.avgRewardScore != null ? (
                      <span className="font-semibold" style={{
                        color: s.avgRewardScore >= 70 ? "var(--success)" : s.avgRewardScore >= 40 ? "var(--warning)" : "var(--danger)"
                      }}>
                        {s.avgRewardScore.toFixed(1)}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-tertiary)" }}>—</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 capitalize" style={{ color: "var(--text-secondary)" }}>{s.deviceType}</td>
                  <td className="px-6 py-3.5" style={{ color: "var(--text-secondary)" }}>
                    {s.preFocus != null && s.postFocus != null ? (
                      <span>
                        {s.preFocus} →{" "}
                        <span className="font-medium" style={{ color: s.postFocus > s.preFocus ? "var(--success)" : "var(--danger)" }}>
                          {s.postFocus}
                        </span>
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <Link href={`/sessions/${s.id}`} className="text-xs font-medium hover:underline" style={{ color: "var(--brand)" }}>
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* CPT Assessment History */}
      <div className="mt-5 rounded-xl border overflow-hidden" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Cognitive Performance (CPT)</h2>
          <Link
            href={`/clients/${id}/cpt`}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: "var(--brand)", color: "var(--text-inverse)" }}
          >
            + Run New Assessment
          </Link>
        </div>
        {cptHistory.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
            No assessments yet.{" "}
            <Link href={`/clients/${id}/cpt`} className="hover:underline" style={{ color: "var(--brand)" }}>
              Run the first CPT
            </Link>{" "}
            to establish a cognitive baseline.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b" style={{ background: "var(--surface-sunken)", borderColor: "var(--border-subtle)" }}>
              <tr>
                {["Date", "Accuracy", "Avg RT", "Hits", "Misses", "False Alarms"].map((h) => (
                  <th key={h} className="text-left px-6 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
              {cptHistory.map((c) => (
                <tr key={c.id}>
                  <td className="px-6 py-3" style={{ color: "var(--text-secondary)" }}>{new Date(c.administeredAt).toLocaleDateString()}</td>
                  <td className="px-6 py-3 font-semibold tabular-nums" style={{ color: c.accuracy >= 80 ? "var(--success)" : c.accuracy >= 60 ? "var(--warning)" : "var(--danger)" }}>
                    {c.accuracy.toFixed(1)}%
                  </td>
                  <td className="px-6 py-3 tabular-nums" style={{ color: "var(--brand)" }}>{c.avgReactionTimeMs != null ? `${c.avgReactionTimeMs} ms` : "—"}</td>
                  <td className="px-6 py-3 tabular-nums" style={{ color: "var(--success)" }}>{c.hits}</td>
                  <td className="px-6 py-3 tabular-nums" style={{ color: "var(--warning)" }}>{c.misses}</td>
                  <td className="px-6 py-3 tabular-nums" style={{ color: "var(--danger)" }}>{c.falseAlarms}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ERP Assessment History */}
      <div className="mt-5 rounded-xl border overflow-hidden" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>ERP / P300 Assessment</h2>
          <Link
            href={`/clients/${id}/erp`}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: "var(--brand)", color: "var(--text-inverse)" }}
          >
            + Run New Assessment
          </Link>
        </div>
        {erpHistory.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
            No ERP assessments yet.{" "}
            <Link href={`/clients/${id}/erp`} className="hover:underline" style={{ color: "var(--brand)" }}>
              Run the first P300 test
            </Link>{" "}
            to measure event-related brain potential.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b" style={{ background: "var(--surface-sunken)", borderColor: "var(--border-subtle)" }}>
              <tr>
                {["Date", "Accuracy", "Avg RT", "Hits", "Misses", "False Alarms"].map((h) => (
                  <th key={h} className="text-left px-6 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
              {erpHistory.map((e) => (
                <tr key={e.id}>
                  <td className="px-6 py-3" style={{ color: "var(--text-secondary)" }}>{new Date(e.administeredAt).toLocaleDateString()}</td>
                  <td className="px-6 py-3 font-semibold tabular-nums" style={{ color: e.accuracy >= 80 ? "var(--success)" : e.accuracy >= 60 ? "var(--warning)" : "var(--danger)" }}>
                    {e.accuracy.toFixed(1)}%
                  </td>
                  <td className="px-6 py-3 tabular-nums" style={{ color: "var(--brand)" }}>{e.avgReactionTimeMs != null ? `${e.avgReactionTimeMs} ms` : "—"}</td>
                  <td className="px-6 py-3 tabular-nums" style={{ color: "var(--success)" }}>{e.hits}</td>
                  <td className="px-6 py-3 tabular-nums" style={{ color: "var(--warning)" }}>{e.misses}</td>
                  <td className="px-6 py-3 tabular-nums" style={{ color: "var(--danger)" }}>{e.falseAlarms}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Goals + Notes */}
      {(client.goals || client.notes) && (
        <div className="mt-5 flex flex-col gap-3">
          {client.goals && (
            <div className="rounded-xl border px-6 py-4" style={{ background: "var(--brand-subtle)", borderColor: "var(--brand-muted)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--brand)" }}>
                Training Goals
              </p>
              <p className="text-sm" style={{ color: "var(--text-primary)" }}>{client.goals}</p>
            </div>
          )}
          {client.notes && (
            <div className="rounded-xl border px-6 py-4" style={{ background: "var(--warning-subtle)", borderColor: "var(--warning-muted)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--warning)" }}>
                Clinical Notes
              </p>
              <p className="text-sm" style={{ color: "var(--text-primary)" }}>{client.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
