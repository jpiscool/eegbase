import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sessions, clients, protocols, sessionDataPoints } from "@/lib/db/schema";
import { eq, and, asc, desc, ne } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GitCompare, Trophy } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDuration(sec: number | null) {
  if (sec == null) return "—";
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function scoreStyle(v: number | null): React.CSSProperties {
  if (v == null) return { color: "var(--text-tertiary)" };
  if (v >= 70) return { color: "var(--success)" };
  if (v >= 40) return { color: "var(--warning)" };
  return { color: "var(--danger)" };
}

function DeltaBadge({ pre, post, invert = false }: { pre: number | null; post: number | null; invert?: boolean }) {
  if (pre == null || post == null) return <span style={{ color: "var(--text-tertiary)" }}>—</span>;
  const delta = post - pre;
  const improved = invert ? delta < 0 : delta > 0;
  const color = improved ? "var(--success)" : delta !== 0 ? "var(--danger)" : "var(--text-secondary)";
  return (
    <span className="font-semibold" style={{ color }}>
      {pre} → {post}
      {delta !== 0 && <span className="text-xs ml-1">({delta > 0 ? "+" : ""}{delta})</span>}
    </span>
  );
}

// ── SVG overlay chart ────────────────────────────────────────────────────────

function RewardOverlayChart({
  seriesA, seriesB, labelA, labelB,
}: {
  seriesA: { t: number; v: number }[];
  seriesB: { t: number; v: number }[];
  labelA: string; labelB: string;
}) {
  const W = 720, H = 180;
  const pad = { top: 10, right: 12, bottom: 28, left: 36 };
  const iW = W - pad.left - pad.right;
  const iH = H - pad.top - pad.bottom;
  const maxT = Math.max(...seriesA.map((p) => p.t), ...seriesB.map((p) => p.t), 1);
  const toX = (t: number) => pad.left + (t / maxT) * iW;
  const toY = (v: number) => pad.top + (1 - Math.max(0, Math.min(100, v)) / 100) * iH;
  const pts = (series: { t: number; v: number }[]) =>
    series.map((p) => `${toX(p.t).toFixed(1)},${toY(p.v).toFixed(1)}`).join(" ");
  const yTicks = [0, 25, 50, 75, 100];
  const maxTMin = Math.round(maxT / 60000);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={pad.left} x2={W - pad.right} y1={toY(v)} y2={toY(v)} stroke="var(--border-subtle)" strokeWidth="1" />
            <text x={pad.left - 5} y={toY(v) + 3.5} textAnchor="end" fontSize="9" fill="var(--text-tertiary)">{v}</text>
          </g>
        ))}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
          <text key={frac} x={pad.left + frac * iW} y={H - 4} textAnchor="middle" fontSize="9" fill="var(--text-tertiary)">
            {Math.round(frac * maxTMin)}m
          </text>
        ))}
        {seriesA.length > 1 && (
          <polyline points={pts(seriesA)} fill="none" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {seriesB.length > 1 && (
          <polyline points={pts(seriesB)} fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        )}
        <rect x={pad.left} y={toY(70)} width={iW} height={toY(40) - toY(70)} fill="var(--success)" opacity="0.06" />
      </svg>
      <div className="flex items-center gap-6 mt-1 pl-9">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded" style={{ background: "#2563EB" }} />
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{labelA}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded" style={{ background: "#10B981" }} />
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{labelB}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: "var(--success-subtle)", border: "1px solid var(--success)" }} />
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Target zone (40–70)</span>
        </div>
      </div>
    </div>
  );
}

// ── Band comparison bar ───────────────────────────────────────────────────────

function BandRow({ label, valA, valB }: { label: string; valA: number | null; valB: number | null }) {
  const fmt = (v: number | null) => (v != null ? v.toFixed(3) : "—");
  const pctDelta = (valA != null && valB != null && valA !== 0)
    ? ((valB - valA) / Math.abs(valA)) * 100
    : null;
  const winnerA = valA != null && valB != null && valA > valB;
  const winnerB = valA != null && valB != null && valB > valA;
  return (
    <div className="grid grid-cols-[80px_1fr_1fr_64px] gap-3 items-center py-1.5">
      <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{label}</span>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-sunken)" }}>
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, (valA ?? 0) * 100)}%`, background: "#2563EB" }} />
        </div>
        <span className="text-xs w-12 text-right tabular-nums" style={{ color: winnerA ? "#2563EB" : "var(--text-secondary)", fontWeight: winnerA ? 700 : 400 }}>
          {fmt(valA)}{winnerA ? " ↑" : ""}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-sunken)" }}>
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, (valB ?? 0) * 100)}%`, background: "#10B981" }} />
        </div>
        <span className="text-xs w-12 text-right tabular-nums" style={{ color: winnerB ? "#10B981" : "var(--text-secondary)", fontWeight: winnerB ? 700 : 400 }}>
          {fmt(valB)}{winnerB ? " ↑" : ""}
        </span>
      </div>
      <span className="text-xs text-right tabular-nums" style={{
        color: pctDelta == null ? "var(--text-tertiary)" : pctDelta > 0 ? "var(--success)" : pctDelta < 0 ? "var(--danger)" : "var(--text-secondary)",
      }}>
        {pctDelta != null ? `${pctDelta > 0 ? "+" : ""}${pctDelta.toFixed(1)}%` : "—"}
      </span>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function CompareSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { a: idA, b: idB } = await searchParams;
  if (!idA) redirect("/sessions");

  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";

  const [rowA] = await db
    .select({ session: sessions, clientName: clients.name, clientId: clients.id, protocolName: protocols.name })
    .from(sessions)
    .innerJoin(clients, and(eq(sessions.clientId, clients.id), eq(clients.clinicId, clinicId)))
    .leftJoin(protocols, eq(sessions.protocolId, protocols.id))
    .where(eq(sessions.id, idA))
    .limit(1);

  if (!rowA) notFound();

  const cardBase = "rounded-xl border p-5 mb-6";
  const cardSt = { background: "var(--surface-raised)", borderColor: "var(--border-subtle)" };

  // ── Session picker ──────────────────────────────────────────────────────
  if (!idB) {
    const otherSessions = await db
      .select({ id: sessions.id, startedAt: sessions.startedAt, durationSeconds: sessions.durationSeconds, avgRewardScore: sessions.avgRewardScore, protocolName: protocols.name })
      .from(sessions)
      .leftJoin(protocols, eq(sessions.protocolId, protocols.id))
      .where(and(eq(sessions.clientId, rowA.clientId), ne(sessions.id, idA)))
      .orderBy(desc(sessions.startedAt))
      .limit(30);

    return (
      <div className="max-w-2xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/sessions/${idA}`} className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--text-tertiary)" }}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Compare Session</h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Select a second session from <span className="font-medium">{rowA.clientName}</span> to compare with {fmtDate(rowA.session.startedAt)}
            </p>
          </div>
        </div>

        {otherSessions.length === 0 ? (
          <div className={cardBase} style={{ ...cardSt, textAlign: "center", paddingTop: "3rem", paddingBottom: "3rem" }}>
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No other sessions recorded for {rowA.clientName}.</p>
            <Link href={`/sessions/${idA}`} className="text-sm hover:underline mt-2 inline-block" style={{ color: "var(--brand)" }}>
              ← Back to session
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
            <div className="px-5 py-3 border-b" style={{ background: "var(--surface-sunken)", borderColor: "var(--border-subtle)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                {rowA.clientName} — Select a session to compare
              </p>
            </div>
            <table className="w-full text-sm">
              <thead className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
                <tr>
                  {["Date", "Protocol", "Duration", "Avg Reward", ""].map((h) => (
                    <th key={h} className="text-left px-5 py-2.5 font-medium" style={{ color: "var(--text-secondary)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                {otherSessions.map((s) => (
                  <tr key={s.id}>
                    <td className="px-5 py-3" style={{ color: "var(--text-primary)" }}>{fmtDate(s.startedAt)}</td>
                    <td className="px-5 py-3" style={{ color: "var(--text-secondary)" }}>{s.protocolName ?? "—"}</td>
                    <td className="px-5 py-3" style={{ color: "var(--text-secondary)" }}>{fmtDuration(s.durationSeconds)}</td>
                    <td className="px-5 py-3">
                      <span className="font-semibold" style={scoreStyle(s.avgRewardScore)}>
                        {s.avgRewardScore != null ? s.avgRewardScore.toFixed(1) : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/sessions/compare?a=${idA}&b=${s.id}`} className="text-xs font-medium hover:underline" style={{ color: "var(--brand)" }}>
                        Compare →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ── Full comparison ───────────────────────────────────────────────────────
  const [[rowB], dpA, dpB] = await Promise.all([
    db.select({ session: sessions, clientName: clients.name, clientId: clients.id, protocolName: protocols.name })
      .from(sessions)
      .innerJoin(clients, and(eq(sessions.clientId, clients.id), eq(clients.clinicId, clinicId)))
      .leftJoin(protocols, eq(sessions.protocolId, protocols.id))
      .where(eq(sessions.id, idB)).limit(1),
    db.select({ t: sessionDataPoints.timestampMs, r: sessionDataPoints.rewardScore,
      delta: sessionDataPoints.delta, theta: sessionDataPoints.theta,
      alpha: sessionDataPoints.alpha, beta: sessionDataPoints.beta, gamma: sessionDataPoints.gamma,
      oxyL: sessionDataPoints.oxyHbLeft, oxyR: sessionDataPoints.oxyHbRight })
      .from(sessionDataPoints).where(eq(sessionDataPoints.sessionId, idA)).orderBy(asc(sessionDataPoints.timestampMs)),
    db.select({ t: sessionDataPoints.timestampMs, r: sessionDataPoints.rewardScore,
      delta: sessionDataPoints.delta, theta: sessionDataPoints.theta,
      alpha: sessionDataPoints.alpha, beta: sessionDataPoints.beta, gamma: sessionDataPoints.gamma,
      oxyL: sessionDataPoints.oxyHbLeft, oxyR: sessionDataPoints.oxyHbRight })
      .from(sessionDataPoints).where(eq(sessionDataPoints.sessionId, idB)).orderBy(asc(sessionDataPoints.timestampMs)),
  ]);

  if (!rowB) notFound();

  const sA = rowA.session;
  const sB = rowB.session;

  function downsample<T>(arr: T[]): T[] {
    if (arr.length <= 400) return arr;
    const step = Math.floor(arr.length / 400);
    return arr.filter((_, i) => i % step === 0);
  }
  const sampledA = downsample(dpA);
  const sampledB = downsample(dpB);

  const rewardA = sampledA.filter((d) => d.r != null).map((d) => ({ t: d.t, v: d.r as number }));
  const rewardB = sampledB.filter((d) => d.r != null).map((d) => ({ t: d.t, v: d.r as number }));

  const avgBand = (dps: typeof dpA, key: "delta" | "theta" | "alpha" | "beta" | "gamma") => {
    const vals = dps.filter((d) => d[key] != null).map((d) => d[key] as number);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };

  const bandsA = { delta: avgBand(dpA, "delta"), theta: avgBand(dpA, "theta"), alpha: avgBand(dpA, "alpha"), beta: avgBand(dpA, "beta"), gamma: avgBand(dpA, "gamma") };
  const bandsB = { delta: avgBand(dpB, "delta"), theta: avgBand(dpB, "theta"), alpha: avgBand(dpB, "alpha"), beta: avgBand(dpB, "beta"), gamma: avgBand(dpB, "gamma") };
  const hasBands = Object.values(bandsA).some((v) => v != null) || Object.values(bandsB).some((v) => v != null);
  const hasFnirs = sampledA.some((d) => d.oxyL != null) || sampledB.some((d) => d.oxyL != null);

  const labelA = `A · ${fmtDate(sA.startedAt)}`;
  const labelB = `B · ${fmtDate(sB.startedAt)}`;
  const rewardWinner: "A" | "B" | null =
    sA.avgRewardScore != null && sB.avgRewardScore != null
      ? sA.avgRewardScore >= sB.avgRewardScore ? "A" : "B"
      : null;

  const metricRows = [
    { label: "Focus", preA: sA.preFocus, postA: sA.postFocus, preB: sB.preFocus, postB: sB.postFocus },
    { label: "Mood", preA: sA.preMood, postA: sA.postMood, preB: sB.preMood, postB: sB.postMood },
    { label: "Anxiety (↓ better)", preA: sA.preAnxiety, postA: sA.postAnxiety, preB: sB.preAnxiety, postB: sB.postAnxiety, invert: true },
    { label: "Energy", preA: sA.preEnergy, postA: sA.postEnergy, preB: sB.preEnergy, postB: sB.postEnergy },
  ];

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/sessions" className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--text-tertiary)" }}>
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <GitCompare size={18} style={{ color: "var(--brand)" }} />
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Session Comparison</h1>
          </div>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            <Link href={`/clients/${rowA.clientId}`} className="hover:underline" style={{ color: "var(--brand)" }}>{rowA.clientName}</Link>
            {rowA.clientId !== rowB.clientId && (
              <> vs <Link href={`/clients/${rowB.clientId}`} className="hover:underline" style={{ color: "var(--brand)" }}>{rowB.clientName}</Link></>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/sessions/${idA}`} className="text-xs hover:underline" style={{ color: "var(--brand)" }}>View A →</Link>
          <span style={{ color: "var(--border-default)" }}>·</span>
          <Link href={`/sessions/${idB}`} className="text-xs hover:underline" style={{ color: "var(--brand)" }}>View B →</Link>
        </div>
      </div>

      {/* Metadata cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {([
          { label: "A", s: sA, row: rowA, accent: "#2563EB" },
          { label: "B", s: sB, row: rowB, accent: "#10B981" },
        ] as const).map(({ label, s, row, accent }) => (
          <div key={label} className="rounded-xl border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)", borderLeft: `4px solid ${accent}` }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Session {label}</span>
                {rewardWinner === label && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--warning-subtle)", color: "var(--warning)" }}>
                    <Trophy size={10} /> Winner
                  </span>
                )}
              </div>
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{fmtDate(s.startedAt)}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Client</p>
                <p className="font-medium" style={{ color: "var(--text-primary)" }}>{row.clientName}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Protocol</p>
                <p className="font-medium" style={{ color: "var(--text-primary)" }}>{row.protocolName ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Duration</p>
                <p className="font-medium" style={{ color: "var(--text-primary)" }}>{fmtDuration(s.durationSeconds)}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Avg Reward</p>
                <p className="font-bold text-lg" style={scoreStyle(s.avgRewardScore)}>
                  {s.avgRewardScore != null ? s.avgRewardScore.toFixed(1) : "—"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reward overlay */}
      {(rewardA.length > 1 || rewardB.length > 1) && (
        <div className={cardBase} style={cardSt}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Reward Score Overlay</h2>
          <RewardOverlayChart seriesA={rewardA} seriesB={rewardB} labelA={labelA} labelB={labelB} />
        </div>
      )}

      {/* Questionnaire */}
      {metricRows.some((m) => m.preA != null || m.preB != null) && (
        <div className={cardBase} style={cardSt}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Questionnaire · Pre → Post</h2>
          <div className="grid grid-cols-[1fr_1fr_1fr] gap-4">
            <div className="pb-2 border-b" style={{ borderColor: "var(--border-subtle)" }} />
            <div className="text-xs font-semibold pb-2 border-b" style={{ color: "#2563EB", borderColor: "var(--border-subtle)" }}>Session A · {fmtDate(sA.startedAt)}</div>
            <div className="text-xs font-semibold pb-2 border-b" style={{ color: "#10B981", borderColor: "var(--border-subtle)" }}>Session B · {fmtDate(sB.startedAt)}</div>
            {metricRows.map((m) => (
              <>
                <div key={`${m.label}-label`} className="text-sm py-2" style={{ color: "var(--text-secondary)" }}>{m.label}</div>
                <div key={`${m.label}-A`} className="text-sm py-2"><DeltaBadge pre={m.preA ?? null} post={m.postA ?? null} invert={m.invert} /></div>
                <div key={`${m.label}-B`} className="text-sm py-2"><DeltaBadge pre={m.preB ?? null} post={m.postB ?? null} invert={m.invert} /></div>
              </>
            ))}
          </div>
        </div>
      )}

      {/* EEG bands */}
      {hasBands && (
        <div className={cardBase} style={cardSt}>
          <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Avg EEG Band Powers</h2>
          <div className="grid grid-cols-[80px_1fr_1fr_64px] gap-3 pb-2 mb-1 border-b" style={{ borderColor: "var(--border-subtle)" }}>
            <div />
            <p className="text-xs font-semibold" style={{ color: "#2563EB" }}>Session A</p>
            <p className="text-xs font-semibold" style={{ color: "#10B981" }}>Session B</p>
            <p className="text-xs font-semibold text-right" style={{ color: "var(--text-tertiary)" }}>Δ% (A→B)</p>
          </div>
          <BandRow label="Delta" valA={bandsA.delta} valB={bandsB.delta} />
          <BandRow label="Theta" valA={bandsA.theta} valB={bandsB.theta} />
          <BandRow label="Alpha" valA={bandsA.alpha} valB={bandsB.alpha} />
          <BandRow label="Beta"  valA={bandsA.beta}  valB={bandsB.beta} />
          <BandRow label="Gamma" valA={bandsA.gamma} valB={bandsB.gamma} />
        </div>
      )}

      {/* fNIRS */}
      {hasFnirs && (
        <div className={cardBase} style={cardSt}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Avg fNIRS OxyHb (μM)</h2>
          <div className="grid grid-cols-2 gap-6">
            {[
              { label: "Session A", dps: sampledA, color: "#2563EB" },
              { label: "Session B", dps: sampledB, color: "#10B981" },
            ].map(({ label, dps, color }) => {
              const oxyLVals = dps.filter((d) => d.oxyL != null).map((d) => d.oxyL as number);
              const oxyRVals = dps.filter((d) => d.oxyR != null).map((d) => d.oxyR as number);
              const avgL = oxyLVals.length > 0 ? oxyLVals.reduce((a, b) => a + b, 0) / oxyLVals.length : null;
              const avgR = oxyRVals.length > 0 ? oxyRVals.reduce((a, b) => a + b, 0) / oxyRVals.length : null;
              return (
                <div key={label}>
                  <p className="text-xs font-semibold mb-2" style={{ color }}>{label}</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: "var(--text-secondary)" }}>OxyHb Left</span>
                      <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{avgL != null ? avgL.toFixed(4) : "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: "var(--text-secondary)" }}>OxyHb Right</span>
                      <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{avgR != null ? avgR.toFixed(4) : "—"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notes */}
      {(sA.notes || sB.notes) && (
        <div className={cardBase} style={cardSt}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Clinical Notes</h2>
          <div className="grid grid-cols-2 gap-6">
            {[{ label: "Session A", notes: sA.notes }, { label: "Session B", notes: sB.notes }].map(({ label, notes }) => (
              <div key={label}>
                <p className="text-xs font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>{label}</p>
                {notes
                  ? <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{notes}</p>
                  : <p className="text-sm italic" style={{ color: "var(--text-tertiary)" }}>No notes recorded.</p>
                }
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
