import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sessions, clients, protocols, sessionDataPoints } from "@/lib/db/schema";
import { eq, and, asc, desc, ne } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GitCompare } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDuration(sec: number | null) {
  if (sec == null) return "—";
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function scoreColor(v: number | null) {
  if (v == null) return "text-gray-400";
  if (v >= 70) return "text-emerald-600";
  if (v >= 40) return "text-amber-600";
  return "text-red-500";
}

function DeltaBadge({ pre, post, invert = false }: { pre: number | null; post: number | null; invert?: boolean }) {
  if (pre == null || post == null) return <span className="text-gray-300">—</span>;
  const delta = post - pre;
  const improved = invert ? delta < 0 : delta > 0;
  const color = improved ? "text-emerald-600" : delta !== 0 ? "text-red-500" : "text-gray-500";
  return (
    <span className={`font-semibold ${color}`}>
      {pre} → {post}
      {delta !== 0 && <span className="text-xs ml-1">({delta > 0 ? "+" : ""}{delta})</span>}
    </span>
  );
}

// ── SVG overlay chart ────────────────────────────────────────────────────────

function RewardOverlayChart({
  seriesA,
  seriesB,
  labelA,
  labelB,
}: {
  seriesA: { t: number; v: number }[];
  seriesB: { t: number; v: number }[];
  labelA: string;
  labelB: string;
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
        {/* Y grid lines */}
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={pad.left} x2={W - pad.right} y1={toY(v)} y2={toY(v)} stroke="#F1F5F9" strokeWidth="1" />
            <text x={pad.left - 5} y={toY(v) + 3.5} textAnchor="end" fontSize="9" fill="#CBD5E1">{v}</text>
          </g>
        ))}
        {/* X axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const min = Math.round(frac * maxTMin);
          return (
            <text key={frac} x={pad.left + frac * iW} y={H - 4} textAnchor="middle" fontSize="9" fill="#CBD5E1">
              {min}m
            </text>
          );
        })}
        {/* Session A line (blue) */}
        {seriesA.length > 1 && (
          <polyline points={pts(seriesA)} fill="none" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {/* Session B line (emerald) */}
        {seriesB.length > 1 && (
          <polyline points={pts(seriesB)} fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {/* Target zone (40-70) */}
        <rect
          x={pad.left} y={toY(70)} width={iW} height={toY(40) - toY(70)}
          fill="#F0FDF4" opacity="0.5"
        />
      </svg>
      {/* Legend */}
      <div className="flex items-center gap-6 mt-1 pl-9">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-blue-600 rounded" />
          <span className="text-xs text-gray-500">{labelA}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-emerald-500 rounded" />
          <span className="text-xs text-gray-500">{labelB}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-green-50 border border-green-200 rounded-sm" />
          <span className="text-xs text-gray-400">Target zone (40–70)</span>
        </div>
      </div>
    </div>
  );
}

// ── Band comparison bar ───────────────────────────────────────────────────────

function BandRow({
  label,
  valA,
  valB,
  color,
}: {
  label: string;
  valA: number | null;
  valB: number | null;
  color: string;
}) {
  const fmt = (v: number | null) => (v != null ? v.toFixed(3) : "—");
  return (
    <div className="grid grid-cols-[80px_1fr_1fr] gap-3 items-center py-1.5">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min(100, (valA ?? 0) * 100)}%` }} />
        </div>
        <span className="text-xs text-gray-600 w-12 text-right tabular-nums">{fmt(valA)}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full ${color} rounded-full opacity-60`} style={{ width: `${Math.min(100, (valB ?? 0) * 100)}%` }} />
        </div>
        <span className="text-xs text-gray-600 w-12 text-right tabular-nums">{fmt(valB)}</span>
      </div>
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

  // ── Fetch session A ──────────────────────────────────────────────────────
  const [rowA] = await db
    .select({
      session: sessions,
      clientName: clients.name,
      clientId: clients.id,
      protocolName: protocols.name,
    })
    .from(sessions)
    .innerJoin(clients, and(eq(sessions.clientId, clients.id), eq(clients.clinicId, clinicId)))
    .leftJoin(protocols, eq(sessions.protocolId, protocols.id))
    .where(eq(sessions.id, idA))
    .limit(1);

  if (!rowA) notFound();

  // ── Session picker (b not provided) ──────────────────────────────────────
  if (!idB) {
    // Show other sessions for the same client for easy comparison
    const otherSessions = await db
      .select({
        id: sessions.id,
        startedAt: sessions.startedAt,
        durationSeconds: sessions.durationSeconds,
        avgRewardScore: sessions.avgRewardScore,
        protocolName: protocols.name,
      })
      .from(sessions)
      .leftJoin(protocols, eq(sessions.protocolId, protocols.id))
      .where(and(eq(sessions.clientId, rowA.clientId), ne(sessions.id, idA)))
      .orderBy(desc(sessions.startedAt))
      .limit(30);

    return (
      <div className="max-w-2xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/sessions/${idA}`} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Compare Session</h1>
            <p className="text-sm text-gray-500">
              Select a second session from <span className="font-medium">{rowA.clientName}</span> to compare with{" "}
              {fmtDate(rowA.session.startedAt)}
            </p>
          </div>
        </div>

        {otherSessions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-sm text-gray-400">No other sessions recorded for {rowA.clientName}.</p>
            <Link href={`/sessions/${idA}`} className="text-sm text-blue-600 hover:underline mt-2 inline-block">
              ← Back to session
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {rowA.clientName} — Select a session to compare
              </p>
            </div>
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-2.5 font-medium text-gray-500">Date</th>
                  <th className="text-left px-5 py-2.5 font-medium text-gray-500">Protocol</th>
                  <th className="text-left px-5 py-2.5 font-medium text-gray-500">Duration</th>
                  <th className="text-left px-5 py-2.5 font-medium text-gray-500">Avg Reward</th>
                  <th className="px-5 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {otherSessions.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-gray-700">{fmtDate(s.startedAt)}</td>
                    <td className="px-5 py-3 text-gray-500">{s.protocolName ?? "—"}</td>
                    <td className="px-5 py-3 text-gray-500">{fmtDuration(s.durationSeconds)}</td>
                    <td className="px-5 py-3">
                      <span className={`font-semibold ${scoreColor(s.avgRewardScore)}`}>
                        {s.avgRewardScore != null ? s.avgRewardScore.toFixed(1) : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/sessions/compare?a=${idA}&b=${s.id}`}
                        className="text-xs font-medium text-blue-600 hover:underline"
                      >
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

  // ── Full comparison: fetch session B + both data point sets ──────────────
  const [[rowB], dpA, dpB] = await Promise.all([
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
      .where(eq(sessions.id, idB))
      .limit(1),
    db
      .select({ t: sessionDataPoints.timestampMs, r: sessionDataPoints.rewardScore,
        delta: sessionDataPoints.delta, theta: sessionDataPoints.theta,
        alpha: sessionDataPoints.alpha, beta: sessionDataPoints.beta, gamma: sessionDataPoints.gamma,
        oxyL: sessionDataPoints.oxyHbLeft, oxyR: sessionDataPoints.oxyHbRight })
      .from(sessionDataPoints).where(eq(sessionDataPoints.sessionId, idA))
      .orderBy(asc(sessionDataPoints.timestampMs)).limit(500),
    db
      .select({ t: sessionDataPoints.timestampMs, r: sessionDataPoints.rewardScore,
        delta: sessionDataPoints.delta, theta: sessionDataPoints.theta,
        alpha: sessionDataPoints.alpha, beta: sessionDataPoints.beta, gamma: sessionDataPoints.gamma,
        oxyL: sessionDataPoints.oxyHbLeft, oxyR: sessionDataPoints.oxyHbRight })
      .from(sessionDataPoints).where(eq(sessionDataPoints.sessionId, idB))
      .orderBy(asc(sessionDataPoints.timestampMs)).limit(500),
  ]);

  if (!rowB) notFound();

  const sA = rowA.session;
  const sB = rowB.session;

  // Reward series (t in ms from session start, v = score)
  const rewardA = dpA.filter((d) => d.r != null).map((d) => ({ t: d.t, v: d.r as number }));
  const rewardB = dpB.filter((d) => d.r != null).map((d) => ({ t: d.t, v: d.r as number }));

  // Average band powers
  const avgBand = (dps: typeof dpA, key: "delta" | "theta" | "alpha" | "beta" | "gamma") => {
    const vals = dps.filter((d) => d[key] != null).map((d) => d[key] as number);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };

  const bandsA = {
    delta: avgBand(dpA, "delta"), theta: avgBand(dpA, "theta"),
    alpha: avgBand(dpA, "alpha"), beta: avgBand(dpA, "beta"), gamma: avgBand(dpA, "gamma"),
  };
  const bandsB = {
    delta: avgBand(dpB, "delta"), theta: avgBand(dpB, "theta"),
    alpha: avgBand(dpB, "alpha"), beta: avgBand(dpB, "beta"), gamma: avgBand(dpB, "gamma"),
  };

  const hasBands = Object.values(bandsA).some((v) => v != null) || Object.values(bandsB).some((v) => v != null);
  const hasFnirs = dpA.some((d) => d.oxyL != null) || dpB.some((d) => d.oxyL != null);

  const labelA = `Session A · ${fmtDate(sA.startedAt)}`;
  const labelB = `Session B · ${fmtDate(sB.startedAt)}`;

  const metricRows = [
    { label: "Focus", preA: sA.preFocus, postA: sA.postFocus, preB: sB.preFocus, postB: sB.postFocus },
    { label: "Mood", preA: sA.preMood, postA: sA.postMood, preB: sB.preMood, postB: sB.postMood },
    { label: "Anxiety (lower=better)", preA: sA.preAnxiety, postA: sA.postAnxiety, preB: sB.preAnxiety, postB: sB.postAnxiety, invert: true },
    { label: "Energy", preA: sA.preEnergy, postA: sA.postEnergy, preB: sB.preEnergy, postB: sB.postEnergy },
  ];

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/sessions" className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <GitCompare size={18} className="text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Session Comparison</h1>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            <Link href={`/clients/${rowA.clientId}`} className="text-blue-600 hover:underline">{rowA.clientName}</Link>
            {rowA.clientId !== rowB.clientId && (
              <> vs <Link href={`/clients/${rowB.clientId}`} className="text-blue-600 hover:underline">{rowB.clientName}</Link></>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/sessions/${idA}`} className="text-xs text-blue-600 hover:underline">View Session A →</Link>
          <span className="text-gray-300">·</span>
          <Link href={`/sessions/${idB}`} className="text-xs text-blue-600 hover:underline">View Session B →</Link>
        </div>
      </div>

      {/* Metadata cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          { label: "A", s: sA, row: rowA, color: "border-l-4 border-l-blue-500" },
          { label: "B", s: sB, row: rowB, color: "border-l-4 border-l-emerald-500" },
        ].map(({ label, s, row, color }) => (
          <div key={label} className={`bg-white rounded-xl border border-gray-200 p-5 ${color}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Session {label}</span>
              <span className="text-xs text-gray-400">{fmtDate(s.startedAt)}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div>
                <p className="text-xs text-gray-400">Client</p>
                <p className="font-medium text-gray-800">{row.clientName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Protocol</p>
                <p className="font-medium text-gray-800">{row.protocolName ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Duration</p>
                <p className="font-medium text-gray-800">{fmtDuration(s.durationSeconds)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Avg Reward</p>
                <p className={`font-bold text-lg ${scoreColor(s.avgRewardScore)}`}>
                  {s.avgRewardScore != null ? s.avgRewardScore.toFixed(1) : "—"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reward overlay chart */}
      {(rewardA.length > 1 || rewardB.length > 1) && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Reward Score Overlay</h2>
          <RewardOverlayChart seriesA={rewardA} seriesB={rewardB} labelA={labelA} labelB={labelB} />
        </div>
      )}

      {/* Questionnaire comparison */}
      {metricRows.some((m) => m.preA != null || m.preB != null) && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Questionnaire · Pre → Post</h2>
          <div className="grid grid-cols-[1fr_1fr_1fr] gap-4">
            <div className="text-xs font-medium text-gray-400 pb-2 border-b border-gray-100" />
            <div className="text-xs font-medium text-blue-600 pb-2 border-b border-gray-100">Session A · {fmtDate(sA.startedAt)}</div>
            <div className="text-xs font-medium text-emerald-600 pb-2 border-b border-gray-100">Session B · {fmtDate(sB.startedAt)}</div>
            {metricRows.map((m) => (
              <>
                <div key={`${m.label}-label`} className="text-sm text-gray-600 py-2">{m.label}</div>
                <div key={`${m.label}-A`} className="text-sm py-2">
                  <DeltaBadge pre={m.preA ?? null} post={m.postA ?? null} invert={m.invert} />
                </div>
                <div key={`${m.label}-B`} className="text-sm py-2">
                  <DeltaBadge pre={m.preB ?? null} post={m.postB ?? null} invert={m.invert} />
                </div>
              </>
            ))}
          </div>
        </div>
      )}

      {/* EEG band powers */}
      {hasBands && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Avg EEG Band Powers</h2>
          <div className="grid grid-cols-[80px_1fr_1fr] gap-3 pb-2 mb-1 border-b border-gray-100">
            <div />
            <p className="text-xs font-medium text-blue-600">Session A</p>
            <p className="text-xs font-medium text-emerald-600">Session B</p>
          </div>
          <BandRow label="Delta" valA={bandsA.delta} valB={bandsB.delta} color="bg-indigo-400" />
          <BandRow label="Theta" valA={bandsA.theta} valB={bandsB.theta} color="bg-amber-400" />
          <BandRow label="Alpha" valA={bandsA.alpha} valB={bandsB.alpha} color="bg-red-400" />
          <BandRow label="Beta"  valA={bandsA.beta}  valB={bandsB.beta}  color="bg-pink-400" />
          <BandRow label="Gamma" valA={bandsA.gamma} valB={bandsB.gamma} color="bg-purple-400" />
        </div>
      )}

      {/* fNIRS average comparison */}
      {hasFnirs && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Avg fNIRS OxyHb (μM)</h2>
          <div className="grid grid-cols-2 gap-6">
            {[
              { label: "Session A", dps: dpA, color: "text-blue-600" },
              { label: "Session B", dps: dpB, color: "text-emerald-600" },
            ].map(({ label, dps, color }) => {
              const oxyLVals = dps.filter((d) => d.oxyL != null).map((d) => d.oxyL as number);
              const oxyRVals = dps.filter((d) => d.oxyR != null).map((d) => d.oxyR as number);
              const avgL = oxyLVals.length > 0 ? oxyLVals.reduce((a, b) => a + b, 0) / oxyLVals.length : null;
              const avgR = oxyRVals.length > 0 ? oxyRVals.reduce((a, b) => a + b, 0) / oxyRVals.length : null;
              return (
                <div key={label}>
                  <p className={`text-xs font-semibold mb-2 ${color}`}>{label}</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">OxyHb Left</span>
                      <span className="font-semibold text-gray-800">
                        {avgL != null ? avgL.toFixed(4) : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">OxyHb Right</span>
                      <span className="font-semibold text-gray-800">
                        {avgR != null ? avgR.toFixed(4) : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Clinical notes comparison */}
      {(sA.notes || sB.notes) && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Clinical Notes</h2>
          <div className="grid grid-cols-2 gap-6">
            {[{ label: "Session A", notes: sA.notes }, { label: "Session B", notes: sB.notes }].map(({ label, notes }) => (
              <div key={label}>
                <p className="text-xs font-medium text-gray-400 mb-1">{label}</p>
                {notes ? (
                  <p className="text-sm text-gray-700 leading-relaxed">{notes}</p>
                ) : (
                  <p className="text-sm text-gray-300 italic">No notes recorded.</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
