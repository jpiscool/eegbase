import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sessions, clients, protocols, sessionDataPoints, clinics, clinicians } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { parseProtocolBlocks, type ProtocolBlock } from "@/components/ProtocolBlockTimer";

export default async function SessionReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";
  const clinicianId = session?.user?.id ?? "";

  const [[row], dataPoints, [clinicRow], [clinicianRow]] = await Promise.all([
    db
      .select({ session: sessions, clientName: clients.name, clientEmail: clients.email, protocolName: protocols.name, protocolParameters: protocols.parameters })
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
        heartRate: sessionDataPoints.heartRate,
        hrvRmssd: sessionDataPoints.hrvRmssd,
      })
      .from(sessionDataPoints)
      .where(eq(sessionDataPoints.sessionId, id))
      .orderBy(asc(sessionDataPoints.timestampMs)),
    db.select({ name: clinics.name }).from(clinics).where(eq(clinics.id, clinicId)).limit(1),
    db.select({ name: clinicians.name, email: clinicians.email }).from(clinicians).where(eq(clinicians.id, clinicianId)).limit(1),
  ]);

  if (!row) notFound();

  const s = row.session;

  function avg(arr: (number | null | undefined)[]): number | null {
    const vals = arr.filter((v): v is number => v != null);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }

  const avgReward = avg(dataPoints.map((d) => d.rewardScore));
  const peakReward = dataPoints.length > 0 ? Math.max(...dataPoints.map((d) => d.rewardScore ?? 0)) : null;
  const avgAlpha = avg(dataPoints.map((d) => d.alpha));
  const avgTheta = avg(dataPoints.map((d) => d.theta));
  const avgBeta = avg(dataPoints.map((d) => d.beta));
  const avgDelta = avg(dataPoints.map((d) => d.delta));
  const avgGamma = avg(dataPoints.map((d) => d.gamma));
  const avgOxyL = avg(dataPoints.map((d) => d.oxyHbLeft));
  const avgOxyR = avg(dataPoints.map((d) => d.oxyHbRight));
  const avgHR = avg(dataPoints.map((d) => d.heartRate));
  const avgRmssd = avg(dataPoints.map((d) => d.hrvRmssd));

  const durationMin = s.durationSeconds != null ? Math.floor(s.durationSeconds / 60) : null;
  const durationSec = s.durationSeconds != null ? s.durationSeconds % 60 : null;

  const sessionQuality =
    (avgReward ?? 0) >= 70 ? "Excellent" :
    (avgReward ?? 0) >= 55 ? "Good" :
    (avgReward ?? 0) >= 40 ? "Fair" : "Below Target";

  const printDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const sessionDate = new Date(s.startedAt).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  // ── Per-block summary ──────────────────────────────────────────────
  // When this session ran against a scripted protocol (blocks in the
  // protocol's parameters jsonb), bucket the data points by block and
  // compute per-block metrics. Otherwise blocks=[] and the section is
  // simply omitted from the report.
  const protocolBlocks: ProtocolBlock[] = parseProtocolBlocks(row.protocolParameters);
  type BlockMetrics = { block: ProtocolBlock; index: number; avgReward: number | null; avgOxyL: number | null; avgOxyR: number | null; sampleCount: number };
  const blockSummary: BlockMetrics[] = [];
  if (protocolBlocks.length > 0 && dataPoints.length > 0) {
    // Compute block boundaries (cumulative seconds, in ms).
    const boundsMs: number[] = [];
    let cum = 0;
    for (const b of protocolBlocks) {
      boundsMs.push(cum * 1000);
      cum += b.durationSeconds;
    }
    boundsMs.push(cum * 1000); // sentinel end
    // Bucket data points. timestampMs is ms-from-session-start.
    for (let i = 0; i < protocolBlocks.length; i++) {
      const lo = boundsMs[i];
      const hi = boundsMs[i + 1];
      const pts = dataPoints.filter((p) => p.timestampMs >= lo && p.timestampMs < hi);
      blockSummary.push({
        block: protocolBlocks[i],
        index: i,
        avgReward: avg(pts.map((p) => p.rewardScore)),
        avgOxyL: avg(pts.map((p) => p.oxyHbLeft)),
        avgOxyR: avg(pts.map((p) => p.oxyHbRight)),
        sampleCount: pts.length,
      });
    }
  }
  const fmtBlockTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec - m * 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <>
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
        }
        body { font-family: 'Georgia', serif; color: #1a1a1a; }
        .report-header { border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; }
        .section { margin-bottom: 28px; }
        .section h2 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; margin-bottom: 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
        .metric-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .metric-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
        .metric-box .val { font-size: 22px; font-weight: 700; color: #111; }
        .metric-box .lbl { font-size: 11px; color: #6b7280; margin-top: 2px; }
        .band-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .band-table th { text-align: left; padding: 6px 12px; background: #f3f4f6; font-weight: 600; font-size: 11px; color: #6b7280; }
        .band-table td { padding: 6px 12px; border-bottom: 1px solid #f3f4f6; }
        .q-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .q-row { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
        .disclaimer { font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 32px; }
      `}</style>

      {/* Print button (hidden when printing) */}
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 text-sm font-semibold rounded-lg shadow"
          style={{ background: "var(--brand)", color: "var(--text-inverse)" }}
        >
          Print / Save PDF
        </button>
        <button
          onClick={() => window.close()}
          className="px-4 py-2 text-sm font-semibold rounded-lg"
          style={{ background: "var(--surface-sunken)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
        >
          Close
        </button>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 40px 60px" }}>
        {/* Header */}
        <div className="report-header">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
                {clinicRow?.name ?? "EEGBase Clinic"} · Neurofeedback Session Report
              </p>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111", margin: 0 }}>{row.clientName}</h1>
              <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{sessionDate}</p>
            </div>
            <div style={{ textAlign: "right", fontSize: 11, color: "#9ca3af" }}>
              <p style={{ margin: 0 }}>Generated: {printDate}</p>
              <p style={{ margin: "2px 0 0" }}>Clinician: {clinicianRow?.name ?? "—"}</p>
              {row.clientEmail && <p style={{ margin: "2px 0 0" }}>Client email: {row.clientEmail}</p>}
              <p style={{ margin: "2px 0 0", fontFamily: "monospace", fontSize: 10 }}>Session ID: {s.id.slice(0, 8)}</p>
            </div>
          </div>
        </div>

        {/* Session overview */}
        <div className="section">
          <h2>Session Overview</h2>
          <div className="metric-grid">
            <div className="metric-box">
              <div className="val">{durationMin != null ? `${durationMin}m ${durationSec}s` : "—"}</div>
              <div className="lbl">Duration</div>
            </div>
            <div className="metric-box">
              <div className="val" style={{ color: (avgReward ?? 0) >= 70 ? "#059669" : (avgReward ?? 0) >= 40 ? "#d97706" : "#dc2626" }}>
                {avgReward != null ? avgReward.toFixed(1) : "—"}
              </div>
              <div className="lbl">Avg Reward Score</div>
            </div>
            <div className="metric-box">
              <div className="val">{peakReward != null ? peakReward.toFixed(1) : "—"}</div>
              <div className="lbl">Peak Reward</div>
            </div>
            <div className="metric-box">
              <div className="val" style={{ color: sessionQuality === "Excellent" ? "#059669" : sessionQuality === "Good" ? "#2563eb" : sessionQuality === "Fair" ? "#d97706" : "#dc2626" }}>
                {sessionQuality}
              </div>
              <div className="lbl">Session Quality</div>
            </div>
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 16, fontSize: 12, color: "#6b7280" }}>
            <span>Device: <strong style={{ color: "#111" }}>{s.deviceType}</strong></span>
            {row.protocolName && <span>Protocol: <strong style={{ color: "#111" }}>{row.protocolName}</strong></span>}
            <span>Samples: <strong style={{ color: "#111" }}>{dataPoints.length}</strong></span>
          </div>
        </div>

        {/* EEG Band Power */}
        {(avgAlpha != null || avgTheta != null) && (
          <div className="section">
            <h2>EEG Band Power · Session Averages</h2>
            <table className="band-table">
              <thead>
                <tr>
                  <th>Band</th>
                  <th>Avg Power</th>
                  <th>Normative Range</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Delta", val: avgDelta, lo: 0.20, hi: 0.45, color: "#6366F1" },
                  { name: "Theta", val: avgTheta, lo: 0.15, hi: 0.35, color: "#0EA5E9" },
                  { name: "Alpha", val: avgAlpha, lo: 0.30, hi: 0.60, color: "#10B981" },
                  { name: "Beta",  val: avgBeta,  lo: 0.15, hi: 0.35, color: "#F59E0B" },
                  { name: "Gamma", val: avgGamma, lo: 0.05, hi: 0.20, color: "#EF4444" },
                ].map(({ name, val, lo, hi, color }) => {
                  const inRange = val != null && val >= lo && val <= hi;
                  const status = val == null ? "No data" : inRange ? "Within norm" : val > hi ? "Above norm" : "Below norm";
                  return (
                    <tr key={name}>
                      <td style={{ color, fontWeight: 600 }}>{name}</td>
                      <td>{val != null ? val.toFixed(3) : "—"}</td>
                      <td style={{ color: "#6b7280" }}>{lo.toFixed(2)} – {hi.toFixed(2)}</td>
                      <td style={{ color: inRange ? "#059669" : val == null ? "#9ca3af" : "#d97706", fontWeight: 600 }}>{status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Protocol block breakdown — per-block reward + HbO summary
            when the session ran a scripted protocol. */}
        {blockSummary.length > 0 && (
          <div className="section">
            <h2>Protocol Block Breakdown</h2>
            <table className="band-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Block</th>
                  <th>Duration</th>
                  <th>Avg Reward</th>
                  <th>Avg HbO L</th>
                  <th>Avg HbO R</th>
                </tr>
              </thead>
              <tbody>
                {blockSummary.map((bs) => (
                  <tr key={bs.index}>
                    <td style={{ fontFamily: "monospace", color: "#6b7280" }}>{bs.index + 1}</td>
                    <td>
                      <strong style={{ textTransform: "capitalize", color: "#111" }}>{bs.block.kind}</strong>
                      <span style={{ color: "#6b7280" }}> — {bs.block.label}</span>
                    </td>
                    <td style={{ fontFamily: "monospace" }}>{fmtBlockTime(bs.block.durationSeconds)}</td>
                    <td style={{ fontFamily: "monospace", color: bs.avgReward != null && bs.avgReward >= 55 ? "#10B981" : "#6b7280" }}>
                      {bs.avgReward?.toFixed(1) ?? "—"}
                    </td>
                    <td style={{ fontFamily: "monospace" }}>{bs.avgOxyL?.toFixed(3) ?? "—"} μM</td>
                    <td style={{ fontFamily: "monospace" }}>{bs.avgOxyR?.toFixed(3) ?? "—"} μM</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* fNIRS */}
        {(avgOxyL != null || avgOxyR != null) && (
          <div className="section">
            <h2>fNIRS Hemodynamics · Session Averages</h2>
            <div className="metric-grid">
              <div className="metric-box">
                <div className="val" style={{ color: "#10B981" }}>{avgOxyL?.toFixed(3) ?? "—"} μM</div>
                <div className="lbl">OxyHb Left (prefrontal)</div>
              </div>
              <div className="metric-box">
                <div className="val" style={{ color: "#0EA5E9" }}>{avgOxyR?.toFixed(3) ?? "—"} μM</div>
                <div className="lbl">OxyHb Right (prefrontal)</div>
              </div>
              {avgOxyL != null && avgOxyR != null && (
                <div className="metric-box" style={{ gridColumn: "span 2" }}>
                  <div className="val" style={{ color: "#6366F1" }}>{Math.abs(avgOxyL - avgOxyR).toFixed(4)} μM</div>
                  <div className="lbl">Bilateral Asymmetry · {avgOxyL >= avgOxyR ? "Left dominant" : "Right dominant"}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* HRV */}
        {(avgHR != null || avgRmssd != null) && (
          <div className="section">
            <h2>Heart Rate Variability</h2>
            <div className="metric-grid">
              <div className="metric-box">
                <div className="val" style={{ color: "#EF4444" }}>{avgHR != null ? Math.round(avgHR) : "—"}</div>
                <div className="lbl">Avg Heart Rate (BPM)</div>
              </div>
              <div className="metric-box">
                <div className="val" style={{ color: "#8B5CF6" }}>{avgRmssd != null ? Math.round(avgRmssd) : "—"} ms</div>
                <div className="lbl">Avg RMSSD (HRV index)</div>
              </div>
              <div className="metric-box" style={{ gridColumn: "span 2" }}>
                <div className="val" style={{ color: (avgRmssd ?? 0) >= 60 ? "#059669" : (avgRmssd ?? 0) >= 35 ? "#d97706" : "#dc2626" }}>
                  {(avgRmssd ?? 0) >= 60 ? "High Coherence" : (avgRmssd ?? 0) >= 35 ? "Moderate Coherence" : "Low Coherence"}
                </div>
                <div className="lbl">Autonomic balance assessment (RMSSD ≥60ms = high coherence)</div>
              </div>
            </div>
          </div>
        )}

        {/* Pre/Post questionnaire */}
        {(s.preFocus != null || s.postFocus != null) && (
          <div className="section">
            <h2>Pre / Post Session Self-Report</h2>
            <div className="q-grid">
              <div>
                <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, marginBottom: 6 }}>PRE-SESSION</div>
                {[
                  { label: "Focus", pre: s.preFocus },
                  { label: "Mood", pre: s.preMood },
                  { label: "Anxiety", pre: s.preAnxiety },
                  { label: "Energy", pre: s.preEnergy },
                ].map(({ label, pre }) => (
                  <div className="q-row" key={label}>
                    <span>{label}</span>
                    <span style={{ fontWeight: 600 }}>{pre ?? "—"} / 10</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, marginBottom: 6 }}>POST-SESSION</div>
                {[
                  { label: "Focus", post: s.postFocus, pre: s.preFocus, invert: false },
                  { label: "Mood", post: s.postMood, pre: s.preMood, invert: false },
                  { label: "Anxiety", post: s.postAnxiety, pre: s.preAnxiety, invert: true },
                  { label: "Energy", post: s.postEnergy, pre: s.preEnergy, invert: false },
                ].map(({ label, post, pre, invert }) => {
                  const improved = pre != null && post != null && (invert ? post < pre : post > pre);
                  return (
                    <div className="q-row" key={label}>
                      <span>{label}</span>
                      <span style={{ fontWeight: 600, color: improved ? "#059669" : post != null && pre != null && post !== pre ? "#dc2626" : "#111" }}>
                        {post ?? "—"} / 10 {pre != null && post != null ? `(${post - pre > 0 ? "+" : ""}${post - pre})` : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Clinical notes */}
        {(s.notes || s.postNotes) && (
          <div className="section">
            <h2>Clinical Notes</h2>
            {s.notes && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, marginBottom: 4 }}>Clinician Notes</p>
                <p style={{ fontSize: 13, color: "#374151", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{s.notes}</p>
              </div>
            )}
            {s.postNotes && (
              <div>
                <p style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, marginBottom: 4 }}>Client Post-Session Notes</p>
                <p style={{ fontSize: 13, color: "#374151", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{s.postNotes}</p>
              </div>
            )}
          </div>
        )}

        {/* AI Summary */}
        {s.aiSummary && (
          <div className="section">
            <h2>AI Clinical Insight</h2>
            <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{s.aiSummary}</p>
          </div>
        )}

        {/* Disclaimer */}
        <div className="disclaimer">
          <p>
            This report was generated by EEGBase and is intended for use by licensed clinicians. It does not constitute
            a medical diagnosis. EEG and fNIRS measurements are functional indicators and should be interpreted in the
            context of a complete clinical assessment. Clinician: {clinicianRow?.name ?? "—"} · {clinicianRow?.email ?? ""}.
          </p>
        </div>
      </div>
    </>
  );
}
