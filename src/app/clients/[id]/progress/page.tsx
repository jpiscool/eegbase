import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clients, sessions, goals, outcomeMeasures } from "@/lib/db/schema";
import { eq, and, desc, avg } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";

export default async function ProgressReportPage({
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

  const [sessionList, allGoals, outcomes, avgRow] = await Promise.all([
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
        preEnergy: sessions.preEnergy,
        postEnergy: sessions.postEnergy,
      })
      .from(sessions)
      .where(eq(sessions.clientId, id))
      .orderBy(desc(sessions.startedAt))
      .limit(100),
    db.select().from(goals).where(eq(goals.clientId, id)).orderBy(goals.targetDate),
    db.select().from(outcomeMeasures).where(eq(outcomeMeasures.clientId, id)).orderBy(desc(outcomeMeasures.administeredAt)),
    db.select({ avg: avg(sessions.avgRewardScore) }).from(sessions).where(eq(sessions.clientId, id)),
  ]);

  const overallAvg = avgRow[0]?.avg ? Number(avgRow[0].avg).toFixed(1) : null;
  const firstSession = sessionList.at(-1);
  const latestSession = sessionList.at(0);

  // Improvement: compare first 5 vs last 5 sessions
  const first5 = sessionList.slice(-5).reverse();
  const last5 = sessionList.slice(0, 5);
  const avgScore = (arr: typeof sessionList) => {
    const vals = arr.filter((s) => s.avgRewardScore != null).map((s) => s.avgRewardScore!);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };
  const earlyAvg = avgScore(first5);
  const recentAvg = avgScore(last5);
  const scoreDelta = earlyAvg != null && recentAvg != null ? recentAvg - earlyAvg : null;

  // Pre/post deltas across all sessions with data
  const metricDelta = (pre: (s: typeof sessionList[0]) => number | null, post: (s: typeof sessionList[0]) => number | null) => {
    const pairs = sessionList.filter((s) => pre(s) != null && post(s) != null);
    if (pairs.length === 0) return null;
    const avg2 = (fn: (s: typeof sessionList[0]) => number | null) =>
      pairs.reduce((a, s) => a + fn(s)!, 0) / pairs.length;
    return { pre: avg2(pre), post: avg2(post), n: pairs.length };
  };

  const focusDelta = metricDelta((s) => s.preFocus, (s) => s.postFocus);
  const moodDelta = metricDelta((s) => s.preMood, (s) => s.postMood);
  const anxietyDelta = metricDelta((s) => s.preAnxiety, (s) => s.postAnxiety);
  const energyDelta = metricDelta((s) => s.preEnergy, (s) => s.postEnergy);

  const reportDate = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <>
      <style>{`
        @media print {
          nav, .no-print { display: none !important; }
          body { font-size: 12px; }
          .page-break { page-break-before: always; }
        }
      `}</style>

      <div className="max-w-3xl">
        {/* Header — hidden on print */}
        <div className="flex items-center gap-3 mb-8 no-print">
          <Link href={`/clients/${id}`} className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--text-tertiary)" }}>
            <ArrowLeft size={18} />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Client Progress Report</h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{client.name}</p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-lg transition-colors"
            style={{ background: "var(--brand)" }}
          >
            <Printer size={15} /> Print / Save PDF
          </button>
        </div>

        {/* Report content — intentionally white for print */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-8">
          {/* Title */}
          <div className="border-b border-gray-200 pb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Neurofeedback Progress Report</h1>
            <p className="text-sm text-gray-500">Prepared {reportDate}</p>
          </div>

          {/* Client info */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Client</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Name:</span> <span className="font-medium text-gray-900">{client.name}</span></div>
              <div><span className="text-gray-500">ID:</span> <span className="font-mono text-gray-500 text-xs">{client.id.slice(0, 8)}</span></div>
              {client.dateOfBirth && (
                <div><span className="text-gray-500">Date of Birth:</span> <span className="font-medium text-gray-900">{new Date(client.dateOfBirth).toLocaleDateString()}</span></div>
              )}
              {client.email && (
                <div><span className="text-gray-500">Email:</span> <span className="font-medium text-gray-900">{client.email}</span></div>
              )}
            </div>
          </div>

          {/* Summary stats */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Training Summary</h2>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Total Sessions", value: String(sessionList.length) },
                { label: "Avg Reward Score", value: overallAvg ? `${overallAvg}%` : "—" },
                { label: "First Session", value: firstSession ? new Date(firstSession.startedAt).toLocaleDateString() : "—" },
                { label: "Most Recent", value: latestSession ? new Date(latestSession.startedAt).toLocaleDateString() : "—" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Score trajectory */}
          {scoreDelta != null && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Reward Score Trajectory</h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-lg font-bold text-gray-700">{earlyAvg!.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500">Early sessions avg (first {first5.length})</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-lg font-bold text-gray-700">{recentAvg!.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500">Recent sessions avg (last {last5.length})</p>
                </div>
                <div className="rounded-lg p-3" style={{ background: scoreDelta >= 0 ? "#F0FDF4" : "#FEF2F2" }}>
                  <p className="text-lg font-bold" style={{ color: scoreDelta >= 0 ? "#15803D" : "#DC2626" }}>
                    {scoreDelta >= 0 ? "+" : ""}{scoreDelta.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">Change</p>
                </div>
              </div>
            </div>
          )}

          {/* Pre/post symptom deltas */}
          {[focusDelta, moodDelta, anxietyDelta, energyDelta].some((d) => d != null) && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Average Pre → Post Session Changes</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-gray-500 font-medium">Metric</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Pre-session avg</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Post-session avg</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Change</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Sessions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[
                    { label: "Focus", data: focusDelta, invert: false },
                    { label: "Mood", data: moodDelta, invert: false },
                    { label: "Anxiety", data: anxietyDelta, invert: true },
                    { label: "Energy", data: energyDelta, invert: false },
                  ].filter(({ data }) => data != null).map(({ label, data, invert }) => {
                    const delta = data!.post - data!.pre;
                    const improved = invert ? delta < 0 : delta > 0;
                    return (
                      <tr key={label}>
                        <td className="py-2.5 text-gray-800 font-medium">{label}</td>
                        <td className="py-2.5 text-right text-gray-600 tabular-nums">{data!.pre.toFixed(1)}</td>
                        <td className="py-2.5 text-right text-gray-600 tabular-nums">{data!.post.toFixed(1)}</td>
                        <td className="py-2.5 text-right font-semibold tabular-nums" style={{ color: improved ? "#059669" : delta !== 0 ? "#EF4444" : "#94A3B8" }}>
                          {delta >= 0 ? "+" : ""}{delta.toFixed(1)}
                        </td>
                        <td className="py-2.5 text-right text-gray-400 tabular-nums">{data!.n}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Outcome measures */}
          {outcomes.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Standardised Outcome Measures</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-gray-500 font-medium">Date</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Measure</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Score</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Interpretation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {outcomes.map((o) => (
                    <tr key={o.id}>
                      <td className="py-2 text-gray-600">{new Date(o.administeredAt).toLocaleDateString()}</td>
                      <td className="py-2 text-gray-800 font-medium uppercase">{o.measureType}</td>
                      <td className="py-2 text-right font-bold tabular-nums text-gray-900">{o.totalScore}</td>
                      <td className="py-2 text-gray-500">{o.interpretation ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Goals */}
          {allGoals.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Treatment Goals</h2>
              <div className="space-y-2">
                {allGoals.map((g) => (
                  <div key={g.id} className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: g.status === "achieved" ? "#10B981" : g.status === "active" ? "#3B82F6" : "#CBD5E1" }} />
                    <span className="text-sm text-gray-800">{g.title}</span>
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full capitalize" style={
                      g.status === "achieved" ? { background: "#F0FDF4", color: "#15803D" }
                      : g.status === "active" ? { background: "#EFF6FF", color: "#1D4ED8" }
                      : { background: "#F1F5F9", color: "#64748B" }
                    }>
                      {g.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Training goals / notes */}
          {(client.goals || client.notes) && (
            <div>
              {client.goals && (
                <div className="mb-3">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Training Goals</h2>
                  <p className="text-sm text-gray-700 leading-relaxed">{client.goals}</p>
                </div>
              )}
              {client.notes && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Clinical Notes</h2>
                  <p className="text-sm text-gray-700 leading-relaxed">{client.notes}</p>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-gray-200 text-xs text-gray-400 text-center">
            This report is generated from EEGBase session data and is intended for clinical use only.
            Data should be interpreted alongside full clinical context. Not for standalone diagnostic purposes.
          </div>
        </div>
      </div>
    </>
  );
}
