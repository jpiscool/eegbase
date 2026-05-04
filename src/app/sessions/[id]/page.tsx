import React from "react";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sessions, clients, protocols, sessionDataPoints, sessionAnnotations } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, GitCompare, Printer, ClipboardList } from "lucide-react";
import { EmailSummaryBtn } from "@/components/EmailSummaryBtn";
import { SessionInvoiceBtn } from "@/components/SessionInvoiceBtn";
import { SessionNotesEditor } from "@/components/SessionNotesEditor";
import { SessionReplayChart } from "@/components/SessionReplayChart";
import { BandPowerChart } from "@/components/BandPowerChart";
import { FNIRSChart } from "@/components/FNIRSChart";
import { DeleteSessionButton } from "@/components/DeleteSessionButton";
import { AiInsightPanel } from "@/components/AiInsightPanel";
import { SessionTagEditor } from "@/components/SessionTagEditor";
import { BrainMapPanel } from "@/components/BrainMapPanel";
import { SessionAnnotations } from "@/components/SessionAnnotations";

function ScoreDelta({
  pre,
  post,
  invert = false,
}: {
  pre: number | null;
  post: number | null;
  invert?: boolean;
}) {
  if (pre == null || post == null) return <span style={{ color: "var(--text-tertiary)" }}>—</span>;
  const improved = invert ? post < pre : post > pre;
  const delta = post - pre;
  const color = improved ? "var(--success)" : delta < 0 ? "var(--danger)" : "var(--text-primary)";
  return (
    <span className="flex items-center gap-2">
      <span style={{ color: "var(--text-secondary)" }}>{pre}</span>
      <span style={{ color: "var(--border-default)" }}>→</span>
      <span className="font-semibold" style={{ color }}>{post}</span>
      {delta !== 0 && (
        <span className="text-xs" style={{ color }}>({delta > 0 ? "+" : ""}{delta})</span>
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
  const [[row], dataPoints, annotationList] = await Promise.all([
    db
      .select({
        session: sessions,
        clientName: clients.name,
        clientId: clients.id,
        clientEmail: clients.email,
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
      .orderBy(asc(sessionDataPoints.timestampMs)),
    db
      .select()
      .from(sessionAnnotations)
      .where(eq(sessionAnnotations.sessionId, id))
      .orderBy(asc(sessionAnnotations.timestampMs)),
  ]);

  if (!row) notFound();

  // Downsample to at most 600 evenly-spaced points for chart rendering
  // (preserves full coverage even for high-frequency Mendi sessions)
  const MAX_CHART_POINTS = 600;
  const sampledPoints =
    dataPoints.length <= MAX_CHART_POINTS
      ? dataPoints
      : (() => {
          const step = Math.floor(dataPoints.length / MAX_CHART_POINTS);
          return dataPoints.filter((_, i) => i % step === 0);
        })();

  const s = row.session;
  const durationMin = s.durationSeconds != null ? Math.floor(s.durationSeconds / 60) : null;
  const durationSec = s.durationSeconds != null ? s.durationSeconds % 60 : null;

  const metrics = [
    { label: "Focus", pre: s.preFocus, post: s.postFocus },
    { label: "Mood", pre: s.preMood, post: s.postMood },
    { label: "Anxiety", pre: s.preAnxiety, post: s.postAnxiety, invert: true },
    { label: "Energy", pre: s.preEnergy, post: s.postEnergy },
  ];

  // Build reward score chart data from downsampled points
  const rewardTrend = sampledPoints
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
  const qualityStyle: React.CSSProperties =
    sessionQuality === "Excellent" ? { color: "var(--success)", background: "var(--success-subtle)", borderColor: "var(--success)" }
    : sessionQuality === "Good" ? { color: "var(--brand)", background: "var(--brand-subtle, color-mix(in srgb, var(--brand) 8%, transparent))", borderColor: "var(--brand)" }
    : sessionQuality === "Fair" ? { color: "var(--warning)", background: "var(--warning-subtle)", borderColor: "var(--warning)" }
    : { color: "var(--danger)", background: "var(--danger-subtle)", borderColor: "var(--danger)" };

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
  const hasFNIRSData = sampledPoints.some(
    (dp) => dp.oxyHbLeft != null || dp.oxyHbRight != null || dp.deoxyHbLeft != null || dp.deoxyHbRight != null
  );
  const fnirsData = hasFNIRSData
    ? sampledPoints.map((dp) => ({
        timestampMs: dp.timestampMs,
        oxyHbLeft: dp.oxyHbLeft ?? null,
        oxyHbRight: dp.oxyHbRight ?? null,
        deoxyHbLeft: dp.deoxyHbLeft ?? null,
        deoxyHbRight: dp.deoxyHbRight ?? null,
      }))
    : [];

  // Check if we have band power data
  const hasBandData = sampledPoints.some(
    (dp) => dp.delta != null || dp.theta != null || dp.alpha != null || dp.beta != null || dp.gamma != null
  );
  const bandData = hasBandData
    ? sampledPoints.map((dp) => ({
        timestampMs: dp.timestampMs,
        delta: dp.delta ?? null,
        theta: dp.theta ?? null,
        alpha: dp.alpha ?? null,
        beta: dp.beta ?? null,
        gamma: dp.gamma ?? null,
      }))
    : [];

  // ── Band Ratio Calculations ───────────────────────────────────────────────
  // Use full dataPoints (not downsampled) for more accurate averages
  function bandAvg(key: "theta" | "alpha" | "beta" | "delta" | "gamma"): number | null {
    const vals = dataPoints.filter((p) => p[key] != null).map((p) => p[key] as number);
    return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
  }
  const avgTheta = hasBandData ? bandAvg("theta") : null;
  const avgAlpha = hasBandData ? bandAvg("alpha") : null;
  const avgBeta = hasBandData ? bandAvg("beta") : null;
  const hasBandRatioData = avgTheta !== null && avgAlpha !== null && avgBeta !== null && avgBeta !== 0;

  const tbrRatio = hasBandRatioData ? Number((avgTheta! / avgBeta!).toFixed(1)) : null;
  const abRatio = hasBandRatioData ? Number((avgAlpha! / avgBeta!).toFixed(1)) : null;
  const atRatio = (hasBandRatioData && avgTheta! !== 0) ? Number((avgAlpha! / avgTheta!).toFixed(1)) : null;

  type RatioStatus = "Normal" | "Elevated" | "High" | "Low";
  function tbrStatus(v: number): RatioStatus {
    return v <= 3 ? "Normal" : v <= 4 ? "Elevated" : "High";
  }
  function abStatus(v: number): RatioStatus {
    return v >= 0.8 && v <= 2.5 ? "Normal" : v > 2.5 ? "Elevated" : "Low";
  }
  function atStatus(v: number): RatioStatus {
    return v >= 0.5 && v <= 2.0 ? "Normal" : v > 2.0 ? "Elevated" : "Low";
  }

  // Compute session-average values for brain map
  function avg(arr: (number | null)[]): number | null {
    const vals = arr.filter((v): v is number => v != null);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }
  const mapOxyL = avg(fnirsData.map((d) => d.oxyHbLeft));
  const mapOxyR = avg(fnirsData.map((d) => d.oxyHbRight));
  const mapDeoxyL = avg(fnirsData.map((d) => d.deoxyHbLeft));
  const mapDeoxyR = avg(fnirsData.map((d) => d.deoxyHbRight));
  const mapAlpha = avg(bandData.map((d) => d.alpha));
  const mapTheta = avg(bandData.map((d) => d.theta));
  const mapBeta  = avg(bandData.map((d) => d.beta));
  const showBrainMap = (hasFNIRSData || hasBandData) && (mapOxyL != null || mapAlpha != null);

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
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: "var(--text-tertiary)" }}
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Session Details</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            <Link href={`/clients/${row.clientId}`} className="hover:underline" style={{ color: "var(--brand)" }}>
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
          href={`/sessions/${s.id}/report`}
          target="_blank"
          className="flex items-center gap-2 px-4 py-2 border text-sm font-medium rounded-lg transition-colors"
          style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)", background: "var(--surface-raised)" }}
        >
          <Printer size={15} />
          Print Report
        </Link>
        <Link
          href={`/sessions/${s.id}/soap`}
          className="flex items-center gap-2 px-4 py-2 border text-sm font-medium rounded-lg transition-colors"
          style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)", background: "var(--surface-raised)" }}
        >
          <ClipboardList size={15} />
          SOAP Note
        </Link>
        <Link
          href={`/sessions/compare?a=${s.id}`}
          className="flex items-center gap-2 px-4 py-2 border text-sm font-medium rounded-lg transition-colors"
          style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)", background: "var(--surface-raised)" }}
        >
          <GitCompare size={15} />
          Compare
        </Link>
        <EmailSummaryBtn sessionId={s.id} clientEmail={row.clientEmail} />
        <SessionInvoiceBtn
          sessionId={s.id}
          clientId={row.clientId}
          clientName={row.clientName}
          durationSeconds={s.durationSeconds}
          sessionDate={s.startedAt}
        />
        <a
          href={`/api/sessions/${s.id}`}
          download={`session-${s.id.slice(0, 8)}.json`}
          className="flex items-center gap-2 px-4 py-2 border text-sm font-medium rounded-lg transition-colors"
          style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)", background: "var(--surface-raised)" }}
        >
          <Download size={15} />
          Export JSON
        </a>
      </div>

      {/* Session quality banner */}
      {sessionQuality && (
        <div className="flex items-center justify-between px-5 py-3 rounded-xl border mb-4" style={qualityStyle}>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold">{sessionQuality}</span>
            <span className="text-xs opacity-70">session quality</span>
          </div>
          <div className="flex items-center gap-6 text-xs">
            <span>Avg: <strong>{s.avgRewardScore!.toFixed(1)}</strong></span>
            {peakReward != null && <span>Peak: <strong>{peakReward.toFixed(1)}</strong></span>}
            <span>Samples: <strong>{dataPoints.length}</strong></span>
            {dataPoints.length > MAX_CHART_POINTS && (
              <span className="opacity-60">({MAX_CHART_POINTS} displayed)</span>
            )}
          </div>
        </div>
      )}

      {/* Narrative insights */}
      {insights.length > 0 && (
        <div className="rounded-xl border p-5 mb-4" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--brand)" }} />
            <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Session Insights</h2>
          </div>
          <ul className="space-y-2">
            {insights.map((text, i) => (
              <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ background: "var(--border-default)" }} />
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
                <span style={{
                  color: s.avgRewardScore >= 70 ? "var(--success)" : s.avgRewardScore >= 40 ? "var(--warning)" : "var(--danger)"
                }}>
                  {s.avgRewardScore.toFixed(1)}%
                </span>
              ) : "—",
          },
          {
            label: "Protocol",
            value: row.protocolName ?? <span style={{ color: "var(--text-tertiary)" }}>None</span>,
          },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border p-4" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
            <p className="text-xs font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>{label}</p>
            <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Reward score replay chart */}
      {rewardTrend.length > 1 && (
        <div className="rounded-xl border p-6 mb-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            Reward Score · Session Replay ({rewardTrend.length} samples)
          </h2>
          <SessionReplayChart data={rewardTrend} />
        </div>
      )}

      {/* fNIRS Hemodynamics (Mendi) */}
      {hasFNIRSData && fnirsData.length > 1 && (
        <div className="rounded-xl border p-6 mb-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              fNIRS Hemodynamics · Session ({fnirsData.length} samples)
            </h2>
            <span className="px-2 py-0.5 text-xs font-medium rounded-full border" style={{ background: "#f5f3ff", color: "#7c3aed", borderColor: "#ddd6fe" }}>
              Mendi
            </span>
          </div>
          <FNIRSChart data={fnirsData} />
        </div>
      )}

      {/* Brain Activity Map */}
      {showBrainMap && (
        <div className="mb-5">
          <BrainMapPanel
            oxyHbLeft={mapOxyL}
            oxyHbRight={mapOxyR}
            deoxyHbLeft={mapDeoxyL}
            deoxyHbRight={mapDeoxyR}
            alpha={mapAlpha}
            theta={mapTheta}
            beta={mapBeta}
            title="Brain Activity Map · Session Average"
          />
        </div>
      )}

      {/* EEG Band Power */}
      {hasBandData && bandData.length > 1 && (
        <div className="rounded-xl border p-6 mb-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            EEG Band Power · Session ({bandData.length} samples)
          </h2>
          <BandPowerChart data={bandData} />
        </div>
      )}

      {/* Band Ratios */}
      {hasBandRatioData && tbrRatio !== null && abRatio !== null && atRatio !== null && (
        <div className="rounded-xl border p-6 mb-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Band Ratios · Session Average
            </h2>
            <span
              className="px-2 py-0.5 text-xs font-medium rounded-full border"
              style={{ background: "var(--brand-subtle)", color: "var(--brand)", borderColor: "color-mix(in srgb, var(--brand) 20%, transparent)" }}
            >
              EEG
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            {/* Theta/Beta Ratio */}
            {(() => {
              const status = tbrStatus(tbrRatio);
              const statusStyles: Record<RatioStatus, React.CSSProperties> = {
                Normal:   { background: "var(--success-subtle)", color: "var(--success)", borderColor: "color-mix(in srgb, var(--success) 25%, transparent)" },
                Elevated: { background: "var(--warning-subtle)", color: "var(--warning)", borderColor: "color-mix(in srgb, var(--warning) 25%, transparent)" },
                High:     { background: "var(--danger-subtle)",  color: "var(--danger)",  borderColor: "color-mix(in srgb, var(--danger) 25%, transparent)"  },
                Low:      { background: "var(--brand-subtle)",   color: "var(--brand)",   borderColor: "color-mix(in srgb, var(--brand) 25%, transparent)"   },
              };
              return (
                <div
                  className="rounded-xl border p-4 flex flex-col gap-1"
                  style={{ background: "var(--surface-sunken)", borderColor: "var(--border-subtle)" }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                    Theta / Beta
                  </p>
                  <p className="text-3xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                    {tbrRatio.toFixed(1)}
                  </p>
                  <span
                    className="self-start text-xs font-medium px-2 py-0.5 rounded-full border"
                    style={statusStyles[status]}
                  >
                    {status}
                  </span>
                  <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                    Normal range: 1.5–3.0
                  </p>
                  <p className="text-xs leading-snug" style={{ color: "var(--text-tertiary)" }}>
                    TBR — clinical marker for attention regulation. Elevated (&gt;4) may indicate attention difficulties.
                  </p>
                </div>
              );
            })()}

            {/* Alpha/Beta Ratio */}
            {(() => {
              const status = abStatus(abRatio);
              const statusStyles: Record<RatioStatus, React.CSSProperties> = {
                Normal:   { background: "var(--success-subtle)", color: "var(--success)", borderColor: "color-mix(in srgb, var(--success) 25%, transparent)" },
                Elevated: { background: "var(--warning-subtle)", color: "var(--warning)", borderColor: "color-mix(in srgb, var(--warning) 25%, transparent)" },
                High:     { background: "var(--danger-subtle)",  color: "var(--danger)",  borderColor: "color-mix(in srgb, var(--danger) 25%, transparent)"  },
                Low:      { background: "var(--brand-subtle)",   color: "var(--brand)",   borderColor: "color-mix(in srgb, var(--brand) 25%, transparent)"   },
              };
              return (
                <div
                  className="rounded-xl border p-4 flex flex-col gap-1"
                  style={{ background: "var(--surface-sunken)", borderColor: "var(--border-subtle)" }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                    Alpha / Beta
                  </p>
                  <p className="text-3xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                    {abRatio.toFixed(1)}
                  </p>
                  <span
                    className="self-start text-xs font-medium px-2 py-0.5 rounded-full border"
                    style={statusStyles[status]}
                  >
                    {status}
                  </span>
                  <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                    Normal range: 0.8–2.5
                  </p>
                  <p className="text-xs leading-snug" style={{ color: "var(--text-tertiary)" }}>
                    Relaxation vs activation balance. &gt;2: relaxed state; &lt;1: heightened activation.
                  </p>
                </div>
              );
            })()}

            {/* Alpha/Theta Ratio */}
            {(() => {
              const status = atStatus(atRatio);
              const statusStyles: Record<RatioStatus, React.CSSProperties> = {
                Normal:   { background: "var(--success-subtle)", color: "var(--success)", borderColor: "color-mix(in srgb, var(--success) 25%, transparent)" },
                Elevated: { background: "var(--warning-subtle)", color: "var(--warning)", borderColor: "color-mix(in srgb, var(--warning) 25%, transparent)" },
                High:     { background: "var(--danger-subtle)",  color: "var(--danger)",  borderColor: "color-mix(in srgb, var(--danger) 25%, transparent)"  },
                Low:      { background: "var(--brand-subtle)",   color: "var(--brand)",   borderColor: "color-mix(in srgb, var(--brand) 25%, transparent)"   },
              };
              return (
                <div
                  className="rounded-xl border p-4 flex flex-col gap-1"
                  style={{ background: "var(--surface-sunken)", borderColor: "var(--border-subtle)" }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                    Alpha / Theta
                  </p>
                  <p className="text-3xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                    {atRatio.toFixed(1)}
                  </p>
                  <span
                    className="self-start text-xs font-medium px-2 py-0.5 rounded-full border"
                    style={statusStyles[status]}
                  >
                    {status}
                  </span>
                  <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                    Normal range: 0.5–2.0
                  </p>
                  <p className="text-xs leading-snug" style={{ color: "var(--text-tertiary)" }}>
                    Depth of relaxation. &gt;1: light relaxation; &lt;1: deeper meditative state.
                  </p>
                </div>
              );
            })()}
          </div>

          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Ratios calculated from session average band power. Individual session values may vary.
          </p>
        </div>
      )}

      {/* Pre / Post questionnaire */}
      {metrics.some((m) => m.pre != null || m.post != null) && (
        <div className="rounded-xl border p-6 mb-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Pre / Post Session Ratings</h2>
          <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
            {metrics.map((m) => (
              <div key={m.label} className="flex items-center justify-between py-3">
                <span className="text-sm font-medium w-24" style={{ color: "var(--text-primary)" }}>{m.label}</span>
                <div className="flex-1">
                  {m.pre != null && (
                    <div className="w-full rounded-full h-1.5 relative overflow-hidden" style={{ background: "var(--surface-sunken)" }}>
                      <div className="absolute top-0 left-0 h-full rounded-full" style={{ width: `${(m.pre / 10) * 100}%`, background: "var(--border-default)" }} />
                    </div>
                  )}
                </div>
                <div className="ml-4 text-sm">
                  <ScoreDelta pre={m.pre} post={m.post} invert={m.invert} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs mt-3" style={{ color: "var(--text-tertiary)" }}>Scale: 1 (low) → 10 (high). For anxiety, lower post-session score = improvement.</p>
        </div>
      )}

      {/* Tags + Notes */}
      <div className="rounded-xl border p-6 mb-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Session Notes</h2>
        {s.postNotes && (
          <div className="mb-4">
            <p className="text-xs font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>Client Post-Session Notes</p>
            <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>{s.postNotes}</p>
          </div>
        )}
        <div className="mb-5">
          <p className="text-xs font-medium mb-2" style={{ color: "var(--text-tertiary)" }}>Clinical Notes</p>
          <SessionNotesEditor sessionId={s.id} initialNotes={s.notes ?? null} />
        </div>
        <div className="border-t pt-5" style={{ borderColor: "var(--border-subtle)" }}>
          <SessionTagEditor sessionId={s.id} initialTags={s.tags ?? null} />
        </div>
      </div>

      {/* Annotations */}
      <SessionAnnotations
        sessionId={id}
        initialAnnotations={annotationList}
        durationSeconds={s.durationSeconds}
      />

      {/* Timestamps */}
      <div className="rounded-xl border p-6" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Session Timeline</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-medium mb-0.5" style={{ color: "var(--text-tertiary)" }}>Started</p>
            <p style={{ color: "var(--text-primary)" }}>
              {new Date(s.startedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium mb-0.5" style={{ color: "var(--text-tertiary)" }}>Ended</p>
            <p style={{ color: "var(--text-primary)" }}>
              {s.endedAt ? new Date(s.endedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium mb-0.5" style={{ color: "var(--text-tertiary)" }}>Session ID</p>
            <p className="font-mono text-xs truncate" style={{ color: "var(--text-tertiary)" }}>{s.id}</p>
          </div>
        </div>
      </div>

      {/* ── Session Replay Stub ─────────────────────────────────────────── */}
      {rewardTrend.length > 1 && (() => {
        // Build SVG sparkline from reward data
        const W = 400, H = 80, PAD = 8;
        const vals = rewardTrend.map(d => d.rewardScore);
        const minV = Math.min(...vals);
        const maxV = Math.max(...vals);
        const rangeV = maxV - minV || 1;

        // Map data points to SVG coordinates
        const pts = vals.map((v, i) => {
          const x = PAD + (i / (vals.length - 1)) * (W - PAD * 2);
          const y = PAD + (1 - (v - minV) / rangeV) * (H - PAD * 2);
          return `${x},${y}`;
        });

        // 60+ threshold line y
        const threshY = PAD + (1 - (60 - minV) / rangeV) * (H - PAD * 2);
        const threshClamped = Math.max(PAD, Math.min(H - PAD, threshY));

        // Map annotations to x positions on timeline
        const sessionDuration = s.durationSeconds ?? rewardTrend[rewardTrend.length - 1].timestampMs / 1000;
        const annotationDots = annotationList.map(ann => {
          const frac = sessionDuration > 0 ? Math.min(1, (ann.timestampMs / 1000) / sessionDuration) : 0;
          const x = PAD + frac * (W - PAD * 2);
          return { x, ann };
        });

        return (
          <div className="rounded-xl border p-6 mb-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Session Replay
                </h2>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full border" style={{ background: "color-mix(in srgb, var(--brand) 8%, transparent)", color: "var(--brand)", borderColor: "color-mix(in srgb, var(--brand) 20%, transparent)" }}>
                  Beta
                </span>
              </div>
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                {vals.length} reward samples
              </span>
            </div>

            {/* SVG sparkline */}
            <div style={{ overflowX: "auto" }}>
              <svg
                viewBox={`0 0 ${W} ${H}`}
                width={W}
                height={H}
                style={{ display: "block", borderRadius: 8, background: "var(--surface-sunken)", maxWidth: "100%" }}
                aria-label="Reward score over session time"
              >
                {/* 60-point threshold dashed line */}
                {threshClamped > PAD && threshClamped < H - PAD && (
                  <line
                    x1={PAD} y1={threshClamped}
                    x2={W - PAD} y2={threshClamped}
                    stroke="var(--success)"
                    strokeWidth="1"
                    strokeDasharray="4 3"
                    opacity="0.5"
                  />
                )}
                {/* Reward sparkline */}
                <polyline
                  points={pts.join(" ")}
                  fill="none"
                  stroke="var(--brand)"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {/* Annotation markers on the timeline (bottom strip) */}
                {annotationDots.map(({ x }, i) => (
                  <circle
                    key={i}
                    cx={x}
                    cy={H - 6}
                    r={3.5}
                    fill="var(--warning)"
                    opacity="0.85"
                  />
                ))}
                {/* Axis labels */}
                <text x={PAD} y={H - 2} fontSize="7" fill="var(--text-tertiary)" fontFamily="monospace">0:00</text>
                <text x={W - PAD} y={H - 2} fontSize="7" fill="var(--text-tertiary)" fontFamily="monospace" textAnchor="end">
                  {Math.floor(sessionDuration / 60)}:{String(Math.round(sessionDuration) % 60).padStart(2, "0")}
                </text>
              </svg>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-3" style={{ flexWrap: "wrap" }}>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
                <div style={{ width: 20, height: 2, background: "var(--brand)", borderRadius: 1 }} />
                Reward score over time
              </div>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
                <div style={{ width: 20, height: 1, borderTop: "1px dashed var(--success)" }} />
                Training threshold (60)
              </div>
              {annotationList.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--warning)", flexShrink: 0 }} />
                  Annotation ({annotationList.length})
                </div>
              )}
            </div>

            {/* Annotation list below sparkline */}
            {annotationList.length > 0 && (
              <div className="mt-4 space-y-1.5">
                {annotationList.map((ann) => {
                  const tSec = Math.round(ann.timestampMs / 1000);
                  const tLabel = `${String(Math.floor(tSec / 60)).padStart(2, "0")}:${String(tSec % 60).padStart(2, "0")}`;
                  return (
                    <div key={ann.id} className="flex items-start gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                      <span className="shrink-0 font-mono" style={{ color: "var(--warning)", marginTop: 1 }}>●</span>
                      <span className="font-mono shrink-0" style={{ color: "var(--text-tertiary)" }}>{tLabel}</span>
                      <span>{ann.label}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <p className="text-xs mt-4 pt-4" style={{ color: "var(--text-tertiary)", borderTop: "1px solid var(--border-subtle)" }}>
              Full interactive replay with 1×/2×/4× playback coming soon.
            </p>
          </div>
        );
      })()}

      {/* Danger zone */}
      <div className="mt-5 rounded-xl border p-5 flex items-center justify-between" style={{ background: "var(--surface-raised)", borderColor: "var(--danger)" }}>
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Delete Session</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>Permanently removes this session and all its data.</p>
        </div>
        <DeleteSessionButton sessionId={s.id} clientId={row.clientId} />
      </div>
    </div>
  );
}
