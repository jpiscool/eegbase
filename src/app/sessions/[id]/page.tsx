import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sessions, clients, protocols, sessionDataPoints } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, GitCompare } from "lucide-react";
import { SessionNotesEditor } from "@/components/SessionNotesEditor";
import { SessionReplayChart } from "@/components/SessionReplayChart";
import { BandPowerChart } from "@/components/BandPowerChart";
import { FNIRSChart } from "@/components/FNIRSChart";
import { DeleteSessionButton } from "@/components/DeleteSessionButton";
import { AiInsightPanel } from "@/components/AiInsightPanel";

function ScoreDelta({
  pre,
  post,
  invert = false,
}: {
  pre: number | null;
  post: number | null;
  invert?: boolean;
}) {
  if (pre == null || post == null) return <span className="text-gray-400">—</span>;
  const improved = invert ? post < pre : post > pre;
  const delta = post - pre;
  return (
    <span className="flex items-center gap-2">
      <span className="text-gray-500">{pre}</span>
      <span className="text-gray-300">→</span>
      <span className={`font-semibold ${improved ? "text-emerald-600" : delta < 0 ? "text-red-500" : "text-gray-700"}`}>
        {post}
      </span>
      {delta !== 0 && (
        <span className={`text-xs ${improved ? "text-emerald-500" : "text-red-400"}`}>
          ({delta > 0 ? "+" : ""}{delta})
        </span>
      )}
    </span>
  );
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";

  // Fetch session joined with client (for clinic ownership check) and protocol
  const [[row], dataPoints] = await Promise.all([
    db
      .select({
        session: sessions,
        clientName: clients.name,
        clientId: clients.id,
        protocolName: protocols.name,
      })
      .from(sessions)
      .innerJoin(clients, and(eq(sessions.clientId, clients.id), eq(clients.clinicId, clinicId)))
      .leftJoin(protocols, eq(sessions.protocolId, protocols.id))
      .where(eq(sessions.id, id))
      .limit(1),
    db
      .select({
        timestampMs: sessionDataPoints.timestampMs,
        rewardScore: sessionDataPoints.rewardScore,
        delta: sessionDataPoints.delta,
        theta: sessionDataPoints.theta,
        alpha: sessionDataPoints.alpha,
        beta: sessionDataPoints.beta,
        gamma: sessionDataPoints.gamma,
        oxyHbLeft: sessionDataPoints.oxyHbLeft,
        oxyHbRight: sessionDataPoints.oxyHbRight,
        deoxyHbLeft: sessionDataPoints.deoxyHbLeft,
        deoxyHbRight: sessionDataPoints.deoxyHbRight,
      })
      .from(sessionDataPoints)
      .where(eq(sessionDataPoints.sessionId, id))
      .orderBy(asc(sessionDataPoints.timestampMs))
      .limit(500),
  ]);

  if (!row) notFound();

  const s = row.session;
  const durationMin = s.durationSeconds != null ? Math.floor(s.durationSeconds / 60) : null;
  const durationSec = s.durationSeconds != null ? s.durationSeconds % 60 : null;

  const metrics = [
    { label: "Focus", pre: s.preFocus, post: s.postFocus },
    { label: "Mood", pre: s.preMood, post: s.postMood },
    { label: "Anxiety", pre: s.preAnxiety, post: s.postAnxiety, invert: true },
    { label: "Energy", pre: s.preEnergy, post: s.postEnergy },
  ];

  // Build reward score chart data from raw data points
  const rewardTrend = dataPoints
    .filter((dp) => dp.rewardScore != null)
    .map((dp) => ({
      timestampMs: dp.timestampMs,
      rewardScore: dp.rewardScore as number,
    }));

  // Compute session insights
  const rewardValues = rewardTrend.map((d) => d.rewardScore);
  const peakReward = rewardValues.length > 0 ? Math.max(...rewardValues) : null;
  const sessionQuality =
    s.avgRewardScore == null ? null
    : s.avgRewardScore >= 70 ? "Excellent"
    : s.avgRewardScore >= 55 ? "Good"
    : s.avgRewardScore >= 40 ? "Fair"
    : "Below Target";
  const qualityColor =
    sessionQuality === "Excellent" ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : sessionQuality === "Good" ? "text-blue-700 bg-blue-50 border-blue-200"
    : sessionQuality === "Fair" ? "text-amber-700 bg-amber-50 border-amber-200"
    : "text-red-700 bg-red-50 border-red-200";

  // ── Narrative insights ────────────────────────────────────────────────────
  const insights: string[] = [];
  if (sessionQuality === "Excellent") {
    insights.push(`Exceptional session — average reward of ${s.avgRewardScore!.toFixed(1)} indicates strong prefrontal engagement throughout.`);
  } else if (sessionQuality === "Good") {
    insights.push(`Good session — average reward of ${s.avgRewardScore!.toFixed(1)} with consistent activation above target.`);
  } else if (sessionQuality === "Fair") {
    insights.push(`Fair performance (avg reward ${s.avgRewardScore!.toFixed(1)}). Consider reviewing pre-session state or adjusting protocol parameters.`);
  } else if (sessionQuality === "Below Target") {
    insights.push(`Below-target session (avg reward ${s.avgRewardScore!.toFixed(1)}). Review protocol fit and whether baseline measurements are calibrated.`);
  }
  const focusDelta = s.preFocus != null && s.postFocus != null ? s.postFocus - s.preFocus : null;
  const anxietyDelta = s.preAnxiety != null && s.postAnxiety != null ? s.postAnxiety - s.preAnxiety : null;
  const moodDelta = s.preMood != null && s.postMood != null ? s.postMood - s.preMood : null;
  const energyDelta = s.preEnergy != null && s.postEnergy != null ? s.postEnergy - s.preEnergy : null;
  if (focusDelta != null && focusDelta > 0)
    insights.push(`Focus improved by +${focusDelta} point${focusDelta !== 1 ? "s" : ""} (${s.preFocus} → ${s.postFocus}) — aligned with expected protocol outcome.`);
  else if (focusDelta != null && focusDelta < 0)
    insights.push(`Focus decreased by ${Math.abs(focusDelta)} post-session (${s.preFocus} → ${s.postFocus}). This may reflect normal post-effort fatigue.`);
  if (anxietyDelta != null && anxietyDelta < 0)
    insights.push(`Anxiety reduced by ${Math.abs(anxietyDelta)} point${Math.abs(anxietyDelta) !== 1 ? "s" : ""} post-session (${s.preAnxiety} → ${s.postAnxiety}).`);
  else if (anxietyDelta != null && anxietyDelta > 0)
    insights.push(`Anxiety increased post-session (${s.preAnxiety} → ${s.postAnxiety}). Follow up to assess session stress load.`);
  if (moodDelta != null && Math.abs(moodDelta) >= 2)
    insights.push(`Mood ${moodDelta > 0 ? `improved by +${moodDelta}` : `decreased by ${Math.abs(moodDelta)}`} post-session (${s.preMood} → ${s.postMood}).`);
  if (energyDelta != null && energyDelta >= 2)
    insights.push(`Energy improved by +${energyDelta} post-session (${s.preEnergy} → ${s.postEnergy}), suggesting positive arousal regulation.`);
  if (s.durationSeconds != null && s.durationSeconds < 600) {
    const actualMin = Math.round(s.durationSeconds / 60);
    insights.push(`Session was ${actualMin} min — shorter than typical. A full 20-minute session is recommended for optimal neuroplasticity effects.`);
  }

  // Check if we have fNIRS data
  const hasFNIRSData = dataPoints.some(
    (dp) => dp.oxyHbLeft != null || dp.oxyHbRight != null || dp.deoxyHbLeft != null || dp.deoxyHbRight != null
  );
  const fnirsData = hasFNIRSData
    ? dataPoints.map((dp) => ({
        timestampMs: dp.timestampMs,
        oxyHbLeft: dp.oxyHbLeft ?? null,
        oxyHbRight: dp.oxyHbRight ?? null,
        deoxyHbLeft: dp.deoxyHbLeft ?? null,
        deoxyHbRight: dp.deoxyHbRight ?? null,
      }))
    : [];

  // Check if we have band power data
  const hasBandData = dataPoints.some(
    (dp) => dp.delta != null || dp.theta != null || dp.alpha != null || dp.beta != null || dp.gamma != null
  );
  const bandData = hasBandData
    ? dataPoints.map((dp) => ({
        timestampMs: dp.timestampMs,
        delta: dp.delta ?? null,
        theta: dp.theta ?? null,
        alpha: dp.alpha ?? null,
        beta: dp.beta ?? null,
        gamma: dp.gamma ?? null,
      }))
    : [];

  // fNIRS trend insight
  if (hasFNIRSData && fnirsData.length > 10) {
    const oxyVals = fnirsData.filter((d) => d.oxyHbLeft != null).map((d) => d.oxyHbLeft!);
    if (oxyVals.length >= 10) {
      const firstAvg = oxyVals.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
      const lastAvg = oxyVals.slice(-5).reduce((a, b) => a + b, 0) / 5;
      if (lastAvg > firstAvg + 0.03)
        insights.push("fNIRS shows an upward OxyHb trend — consistent with sustained prefrontal activation and engagement.");
      else if (lastAvg < firstAvg - 0.03)
        insights.push("fNIRS OxyHb declined toward session end, suggesting fatigue. Consider reducing session length.");
    }
  }

  // EEG dominant band insight
  if (hasBandData && bandData.length > 5) {
    const avgBand = (key: keyof typeof bandData[0]) => {
      const vals = bandData.filter((d) => d[key] != null).map((d) => d[key] as number);
      return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    };
    const bands = { delta: avgBand("delta"), theta: avgBand("theta"), alpha: avgBand("alpha"), beta: avgBand("beta"), gamma: avgBand("gamma") };
    const dominant = (Object.entries(bands) as [string, number][]).sort((a, b) => b[1] - a[1])[0]?.[0];
    const bandDescriptions: Record<string, string> = {
      delta: "slow-wave delta activity dominance, typical in deeply relaxed or drowsy states",
      theta: "theta dominance — associated with relaxed focus, creativity, and memory consolidation",
      alpha: "alpha rhythm dominance — reflecting a calm, alert cognitive state",
      beta: "beta dominance — indicating active processing and sustained task focus",
      gamma: "high gamma activity — suggesting intensive cognitive engagement",
    };
    if (dominant && (bands as Record<string, number>)[dominant] > 0.05)
      insights.push(`EEG shows ${bandDescriptions[dominant] ?? dominant}.`);
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/sessions"
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Session Details</h1>
          <p className="text-sm text-gray-500">
            <Link href={`/clients/${row.clientId}`} className="text-blue-600 hover:underline">
              {row.clientName}
            </Link>
            {" · "}
            {new Date(s.startedAt).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <Link
          href={`/sessions/compare?a=${s.id}`}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          <GitCompare size={15} />
          Compare
        </Link>
        <a
          href={`/api/sessions/${s.id}`}
          download={`session-${s.id.slice(0, 8)}.json`}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download size={15} />
          Export JSON
        </a>
      </div>

      {/* Session quality banner */}
      {sessionQuality && (
        <div className={`flex items-center justify-between px-5 py-3 rounded-xl border mb-4 ${qualityColor}`}>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold">{sessionQuality}</span>
            <span className="text-xs opacity-70">session quality</span>
          </div>
          <div className="flex items-center gap-6 text-xs">
            <span>Avg: <strong>{s.avgRewardScore!.toFixed(1)}</strong></span>
            {peakReward != null && <span>Peak: <strong>{peakReward.toFixed(1)}</strong></span>}
            <span>Samples: <strong>{dataPoints.length}</strong></span>
          </div>
        </div>
      )}

      {/* Narrative insights */}
      {insights.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Session Insights</h2>
          </div>
          <ul className="space-y-2">
            {insights.map((text, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                {text}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* AI Clinical Insight */}
      <AiInsightPanel sessionId={s.id} initialSummary={s.aiSummary ?? null} />

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Device",
            value: <span className="capitalize">{s.deviceType}</span>,
          },
          {
            label: "Duration",
            value:
              durationMin != null
                ? `${durationMin}m ${durationSec}s`
                : "—",
          },
          {
            label: "Avg Reward",
            value:
              s.avgRewardScore != null ? (
                <span
                  className={
                    s.avgRewardScore >= 70
                      ? "text-emerald-600"
                      : s.avgRewardScore >= 40
                      ? "text-amber-600"
                      : "text-red-500"
                  }
                >
                  {s.avgRewardScore.toFixed(1)}%
                </span>
              ) : (
                "—"
              ),
          },
          {
            label: "Protocol",
            value: row.protocolName ?? <span className="text-gray-400">None</span>,
          },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-400 mb-1">{label}</p>
            <p className="text-base font-semibold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Reward score replay chart */}
      {rewardTrend.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Reward Score · Session Replay ({rewardTrend.length} samples)
          </h2>
          <SessionReplayChart data={rewardTrend} />
        </div>
      )}

      {/* fNIRS Hemodynamics (Mendi) */}
      {hasFNIRSData && fnirsData.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold text-gray-700">
              fNIRS Hemodynamics · Session ({fnirsData.length} samples)
            </h2>
            <span className="px-2 py-0.5 text-xs font-medium bg-violet-50 text-violet-600 rounded-full border border-violet-100">
              Mendi
            </span>
          </div>
          <FNIRSChart data={fnirsData} />
        </div>
      )}

      {/* EEG Band Power */}
      {hasBandData && bandData.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            EEG Band Power · Session ({bandData.length} samples)
          </h2>
          <BandPowerChart data={bandData} />
        </div>
      )}

      {/* Pre / Post questionnaire */}
      {metrics.some((m) => m.pre != null || m.post != null) && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Pre / Post Session Ratings</h2>
          <div className="divide-y divide-gray-50">
            {metrics.map((m) => (
              <div key={m.label} className="flex items-center justify-between py-3">
                <span className="text-sm font-medium text-gray-700 w-24">{m.label}</span>
                <div className="flex-1">
                  {m.pre != null && (
                    <div className="w-full bg-gray-100 rounded-full h-1.5 relative overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full bg-gray-300 rounded-full"
                        style={{ width: `${(m.pre / 10) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
                <div className="ml-4 text-sm">
                  <ScoreDelta pre={m.pre} post={m.post} invert={m.invert} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">Scale: 1 (low) → 10 (high). For anxiety, lower post-session score = improvement.</p>
        </div>
      )}

      {/* Notes */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Session Notes</h2>
        {s.postNotes && (
          <div className="mb-4">
            <p className="text-xs text-gray-400 font-medium mb-1">Client Post-Session Notes</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{s.postNotes}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-gray-400 font-medium mb-2">Clinical Notes</p>
          <SessionNotesEditor sessionId={s.id} initialNotes={s.notes ?? null} />
        </div>
      </div>

      {/* Timestamps */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Session Timeline</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 font-medium mb-0.5">Started</p>
            <p className="text-gray-900">
              {new Date(s.startedAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium mb-0.5">Ended</p>
            <p className="text-gray-900">
              {s.endedAt
                ? new Date(s.endedAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium mb-0.5">Session ID</p>
            <p className="text-gray-400 font-mono text-xs truncate">{s.id}</p>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-xl border border-red-100 p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700">Delete Session</p>
          <p className="text-xs text-gray-400 mt-0.5">Permanently removes this session and all its data.</p>
        </div>
        <DeleteSessionButton sessionId={s.id} clientId={row.clientId} />
      </div>
    </div>
  );
}
