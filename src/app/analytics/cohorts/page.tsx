"use client";

import { useState } from "react";
import { Users, TrendingUp, BarChart3, Info } from "lucide-react";

// ── Mock data ─────────────────────────────────────────────────────────────────

// Reward trajectories over 20 sessions
const SMR_TRAJECTORY = [52, 54, 55, 57, 58, 60, 61, 62, 63, 65, 66, 67, 68, 69, 70, 71, 72, 73, 73, 74];
const ALPHA_THETA_TRAJECTORY = [48, 50, 51, 53, 54, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 71];

type CohortKey = "smr" | "alpha-theta" | "beta" | "scp";
type GroupBy = "Protocol" | "Age Range" | "Tag" | "Device";

const COHORT_OPTIONS: Record<GroupBy, { label: string; value: CohortKey }[]> = {
  Protocol: [
    { label: "SMR Training for ADHD", value: "smr" },
    { label: "Alpha/Theta Depth Training", value: "alpha-theta" },
    { label: "Beta Enhancement", value: "beta" },
    { label: "Slow Cortical Potential", value: "scp" },
  ],
  "Age Range": [
    { label: "18–35", value: "smr" },
    { label: "36–55", value: "alpha-theta" },
    { label: "55+", value: "beta" },
    { label: "Under 18", value: "scp" },
  ],
  Tag: [
    { label: "adhd", value: "smr" },
    { label: "relaxation", value: "alpha-theta" },
    { label: "focus", value: "beta" },
    { label: "advanced", value: "scp" },
  ],
  Device: [
    { label: "Muse EEG", value: "smr" },
    { label: "Mendi fNIRS", value: "alpha-theta" },
    { label: "Simulator", value: "beta" },
    { label: "All Devices", value: "scp" },
  ],
};

const COHORT_META: Record<CohortKey, {
  label: string;
  clients: number;
  avgSessions: number;
  avgReward: number;
  dropoff: string;
  improvement: string;
  trajectory: number[];
  questionnaire: { focus: number; mood: number; anxiety: number; energy: number };
  adherence: number;
}> = {
  smr: {
    label: "SMR Training",
    clients: 8,
    avgSessions: 24,
    avgReward: 68,
    dropoff: "12%",
    improvement: "+22%",
    trajectory: SMR_TRAJECTORY,
    questionnaire: { focus: 18, mood: 12, anxiety: -16, energy: 14 },
    adherence: 87,
  },
  "alpha-theta": {
    label: "Alpha/Theta",
    clients: 6,
    avgSessions: 18,
    avgReward: 64,
    dropoff: "8%",
    improvement: "+19%",
    trajectory: ALPHA_THETA_TRAJECTORY,
    questionnaire: { focus: 10, mood: 20, anxiety: -22, energy: 9 },
    adherence: 92,
  },
  beta: {
    label: "Beta Enhancement",
    clients: 5,
    avgSessions: 14,
    avgReward: 61,
    dropoff: "20%",
    improvement: "+14%",
    trajectory: [50, 52, 53, 55, 56, 57, 58, 59, 60, 61, 62, 62, 63, 63, 64, 64, 65, 65, 66, 66],
    questionnaire: { focus: 22, mood: 8, anxiety: -9, energy: 19 },
    adherence: 74,
  },
  scp: {
    label: "SCP Training",
    clients: 4,
    avgSessions: 32,
    avgReward: 58,
    dropoff: "5%",
    improvement: "+11%",
    trajectory: [44, 46, 47, 48, 49, 50, 51, 52, 52, 53, 54, 54, 55, 55, 56, 56, 57, 57, 58, 58],
    questionnaire: { focus: 7, mood: 6, anxiety: -11, energy: 6 },
    adherence: 95,
  },
};

// ── SVG Line Chart ────────────────────────────────────────────────────────────

function LineChart({
  seriesA,
  seriesB,
  labelA,
  labelB,
}: {
  seriesA: number[];
  seriesB: number[];
  labelA: string;
  labelB: string;
}) {
  const W = 540;
  const H = 180;
  const PAD = { top: 12, right: 20, bottom: 28, left: 36 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const allVals = [...seriesA, ...seriesB];
  const minV = Math.min(...allVals) - 4;
  const maxV = Math.max(...allVals) + 4;
  const steps = seriesA.length;

  function toX(i: number) {
    return PAD.left + (i / (steps - 1)) * innerW;
  }
  function toY(v: number) {
    return PAD.top + innerH - ((v - minV) / (maxV - minV)) * innerH;
  }
  function polyline(series: number[]) {
    return series.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
  }

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((t) => minV + t * (maxV - minV));

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", maxWidth: W, display: "block" }}
        aria-label="Reward score trajectory comparison"
      >
        {/* Grid lines */}
        {gridLines.map((v) => (
          <g key={v}>
            <line
              x1={PAD.left}
              x2={PAD.left + innerW}
              y1={toY(v)}
              y2={toY(v)}
              stroke="var(--border-subtle)"
              strokeWidth="1"
            />
            <text
              x={PAD.left - 4}
              y={toY(v) + 4}
              textAnchor="end"
              fontSize="9"
              fill="var(--text-tertiary)"
            >
              {Math.round(v)}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {[1, 5, 10, 15, 20].map((n) => (
          <text
            key={n}
            x={toX(n - 1)}
            y={H - 6}
            textAnchor="middle"
            fontSize="9"
            fill="var(--text-tertiary)"
          >
            {n}
          </text>
        ))}

        {/* Series B (alpha-theta) — brand */}
        <polyline
          points={polyline(seriesB)}
          fill="none"
          stroke="var(--success)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {seriesB.map((v, i) => (
          <circle key={i} cx={toX(i)} cy={toY(v)} r="2.5" fill="var(--success)" />
        ))}

        {/* Series A (SMR) — brand */}
        <polyline
          points={polyline(seriesA)}
          fill="none"
          stroke="var(--brand)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {seriesA.map((v, i) => (
          <circle key={i} cx={toX(i)} cy={toY(v)} r="2.5" fill="var(--brand)" />
        ))}

        {/* Legend */}
        <circle cx={PAD.left + 6} cy={PAD.top + 6} r="4" fill="var(--brand)" />
        <text x={PAD.left + 14} y={PAD.top + 10} fontSize="9" fill="var(--text-secondary)">
          {labelA}
        </text>
        <circle cx={PAD.left + 120} cy={PAD.top + 6} r="4" fill="var(--success)" />
        <text x={PAD.left + 128} y={PAD.top + 10} fontSize="9" fill="var(--text-secondary)">
          {labelB}
        </text>
      </svg>
    </div>
  );
}

// ── Grouped Bar Chart ─────────────────────────────────────────────────────────

function GroupedBarChart({
  dataA,
  dataB,
  labelA,
  labelB,
}: {
  dataA: { focus: number; mood: number; anxiety: number; energy: number };
  dataB: { focus: number; mood: number; anxiety: number; energy: number };
  labelA: string;
  labelB: string;
}) {
  const keys = ["focus", "mood", "anxiety", "energy"] as const;
  const allAbsVals = keys.flatMap((k) => [Math.abs(dataA[k]), Math.abs(dataB[k])]);
  const maxAbs = Math.max(...allAbsVals, 5);
  const BAR_H = 22;
  const BAR_GAP = 4;
  const GROUP_GAP = 16;
  const LABEL_W = 60;
  const CHART_W = 380;
  const PER_UNIT = CHART_W / (maxAbs * 2);
  const ZERO_X = LABEL_W + maxAbs * PER_UNIT;
  const totalH = keys.length * (BAR_H * 2 + BAR_GAP + GROUP_GAP) + 30;

  return (
    <div style={{ overflowX: "auto" }}>
      <svg
        viewBox={`0 0 ${LABEL_W + CHART_W} ${totalH}`}
        style={{ width: "100%", maxWidth: LABEL_W + CHART_W, display: "block" }}
        aria-label="Pre–Post questionnaire comparison"
      >
        {/* Zero line */}
        <line x1={ZERO_X} x2={ZERO_X} y1={0} y2={totalH - 20} stroke="var(--border-default)" strokeWidth="1" />

        {keys.map((k, gi) => {
          const yBase = gi * (BAR_H * 2 + BAR_GAP + GROUP_GAP) + 16;
          const vA = dataA[k];
          const vB = dataB[k];
          const colorA = vA > 0 ? "var(--brand)" : "var(--danger)";
          const colorB = vB > 0 ? "var(--success)" : "var(--warning)";
          const wA = Math.abs(vA) * PER_UNIT;
          const wB = Math.abs(vB) * PER_UNIT;
          const xA = vA >= 0 ? ZERO_X : ZERO_X - wA;
          const xB = vB >= 0 ? ZERO_X : ZERO_X - wB;
          return (
            <g key={k}>
              <text x={LABEL_W - 4} y={yBase + BAR_H / 2 + 4} textAnchor="end" fontSize="9" fill="var(--text-secondary)">
                {k.charAt(0).toUpperCase() + k.slice(1)}
              </text>
              {/* Bar A */}
              <rect x={xA} y={yBase} width={wA} height={BAR_H - 2} rx="2" fill={colorA} opacity="0.85" />
              <text
                x={vA >= 0 ? xA + wA + 3 : xA - 3}
                y={yBase + BAR_H / 2 + 4}
                textAnchor={vA >= 0 ? "start" : "end"}
                fontSize="8"
                fill="var(--text-tertiary)"
              >
                {vA > 0 ? "+" : ""}{vA}%
              </text>
              {/* Bar B */}
              <rect x={xB} y={yBase + BAR_H + BAR_GAP} width={wB} height={BAR_H - 2} rx="2" fill={colorB} opacity="0.75" />
              <text
                x={vB >= 0 ? xB + wB + 3 : xB - 3}
                y={yBase + BAR_H + BAR_GAP + BAR_H / 2 + 4}
                textAnchor={vB >= 0 ? "start" : "end"}
                fontSize="8"
                fill="var(--text-tertiary)"
              >
                {vB > 0 ? "+" : ""}{vB}%
              </text>
            </g>
          );
        })}

        {/* Legend */}
        <rect x={LABEL_W} y={totalH - 16} width={10} height={8} rx="2" fill="var(--brand)" />
        <text x={LABEL_W + 13} y={totalH - 9} fontSize="8" fill="var(--text-secondary)">{labelA}</text>
        <rect x={LABEL_W + 90} y={totalH - 16} width={10} height={8} rx="2" fill="var(--success)" opacity="0.75" />
        <text x={LABEL_W + 103} y={totalH - 9} fontSize="8" fill="var(--text-secondary)">{labelB}</text>
      </svg>
    </div>
  );
}

// ── Adherence Bar ─────────────────────────────────────────────────────────────

function AdherenceBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-28 shrink-0" style={{ color: "var(--text-secondary)" }}>{label}</span>
      <div
        className="flex-1 h-5 rounded-full overflow-hidden"
        style={{ background: "var(--surface-sunken)" }}
      >
        <div
          className="h-full rounded-full flex items-center pl-2"
          style={{ width: `${pct}%`, background: color, transition: "width 0.4s ease" }}
        >
          <span className="text-xs font-semibold" style={{ color: "var(--text-inverse)" }}>
            {pct}%
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Cohort Builder Slot ───────────────────────────────────────────────────────

function CohortSlot({
  slot,
  groupBy,
  value,
  color,
  onGroupByChange,
  onValueChange,
}: {
  slot: "A" | "B";
  groupBy: GroupBy;
  value: CohortKey;
  color: string;
  onGroupByChange: (v: GroupBy) => void;
  onValueChange: (v: CohortKey) => void;
}) {
  const options = COHORT_OPTIONS[groupBy];
  return (
    <div
      className="rounded-xl border p-4 flex-1"
      style={{
        background: "var(--surface-raised)",
        borderColor: "var(--border-subtle)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{ background: color, color: "var(--text-inverse)" }}
        >
          {slot}
        </div>
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Cohort {slot}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>
            Group by
          </label>
          <select
            value={groupBy}
            onChange={(e) => onGroupByChange(e.target.value as GroupBy)}
            className="w-full px-3 py-1.5 text-sm rounded-lg outline-none"
            style={{
              background: "var(--surface-sunken)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          >
            {(["Protocol", "Age Range", "Tag", "Device"] as GroupBy[]).map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>
            Value
          </label>
          <select
            value={value}
            onChange={(e) => onValueChange(e.target.value as CohortKey)}
            className="w-full px-3 py-1.5 text-sm rounded-lg outline-none"
            style={{
              background: "var(--surface-sunken)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div
        className="mt-4 rounded-lg px-3 py-2 text-xs"
        style={{ background: "var(--surface-sunken)", color: "var(--text-tertiary)" }}
      >
        {COHORT_META[value].clients} clients · avg {COHORT_META[value].avgSessions} sessions
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

const GROUP_BY_OPTIONS: GroupBy[] = ["Protocol", "Age Range", "Tag", "Device"];

export default function CohortsPage() {
  const [groupByA, setGroupByA] = useState<GroupBy>("Protocol");
  const [valueA, setValueA] = useState<CohortKey>("smr");
  const [groupByB, setGroupByB] = useState<GroupBy>("Protocol");
  const [valueB, setValueB] = useState<CohortKey>("alpha-theta");

  const cohortA = COHORT_META[valueA];
  const cohortB = COHORT_META[valueB];

  const summaryRows: { label: string; a: string; b: string }[] = [
    { label: "Client Count", a: String(cohortA.clients), b: String(cohortB.clients) },
    { label: "Avg Sessions", a: String(cohortA.avgSessions), b: String(cohortB.avgSessions) },
    { label: "Avg Reward Score", a: String(cohortA.avgReward), b: String(cohortB.avgReward) },
    { label: "Drop-off Rate", a: cohortA.dropoff, b: cohortB.dropoff },
    { label: "Avg Improvement", a: cohortA.improvement, b: cohortB.improvement },
  ];

  return (
    <div className="max-w-4xl space-y-8 pb-12">

      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Users size={20} style={{ color: "var(--text-secondary)" }} />
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Cohort Analysis
          </h1>
        </div>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Compare client groups by protocol, diagnosis, or demographics
        </p>
      </div>

      {/* ── Note ── */}
      <div
        className="flex items-start gap-2 rounded-lg px-4 py-3 text-sm"
        style={{
          background: "var(--warning-subtle)",
          border: "1px solid color-mix(in srgb, var(--warning) 25%, transparent)",
          color: "var(--warning)",
        }}
      >
        <Info size={15} className="shrink-0 mt-0.5" />
        <span>
          Live cohort data requires 10+ sessions per group. Charts below use representative demo data.
        </span>
      </div>

      {/* ── Cohort Builder ── */}
      <section>
        <h2
          className="text-xs font-semibold uppercase tracking-wider mb-4"
          style={{ color: "var(--text-tertiary)" }}
        >
          Cohort Builder
        </h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <CohortSlot
            slot="A"
            groupBy={groupByA}
            value={valueA}
            color="var(--brand)"
            onGroupByChange={setGroupByA}
            onValueChange={setValueA}
          />
          <div
            className="hidden sm:flex items-center justify-center text-lg font-bold"
            style={{ color: "var(--text-tertiary)" }}
          >
            vs
          </div>
          <CohortSlot
            slot="B"
            groupBy={groupByB}
            value={valueB}
            color="var(--success)"
            onGroupByChange={setGroupByB}
            onValueChange={setValueB}
          />
        </div>
      </section>

      {/* ── Charts ── */}

      {/* Reward trajectory */}
      <section
        className="rounded-xl border p-5"
        style={{
          background: "var(--surface-raised)",
          borderColor: "var(--border-subtle)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={15} style={{ color: "var(--text-secondary)" }} />
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Reward Score Trajectory
          </h2>
          <span className="text-xs ml-auto" style={{ color: "var(--text-tertiary)" }}>
            Sessions 1–20
          </span>
        </div>
        <LineChart
          seriesA={cohortA.trajectory}
          seriesB={cohortB.trajectory}
          labelA={cohortA.label}
          labelB={cohortB.label}
        />
      </section>

      {/* Questionnaire improvement */}
      <section
        className="rounded-xl border p-5"
        style={{
          background: "var(--surface-raised)",
          borderColor: "var(--border-subtle)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={15} style={{ color: "var(--text-secondary)" }} />
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Pre→Post Questionnaire Improvement
          </h2>
        </div>
        <p className="text-xs mb-4" style={{ color: "var(--text-tertiary)" }}>
          Percentage change from first session to latest session. Anxiety: negative = improvement.
        </p>
        <GroupedBarChart
          dataA={cohortA.questionnaire}
          dataB={cohortB.questionnaire}
          labelA={cohortA.label}
          labelB={cohortB.label}
        />
      </section>

      {/* Session adherence */}
      <section
        className="rounded-xl border p-5"
        style={{
          background: "var(--surface-raised)",
          borderColor: "var(--border-subtle)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="flex items-center gap-2 mb-5">
          <Users size={15} style={{ color: "var(--text-secondary)" }} />
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Session Adherence
          </h2>
        </div>
        <div className="space-y-3">
          <AdherenceBar
            label={cohortA.label}
            pct={cohortA.adherence}
            color="var(--brand)"
          />
          <AdherenceBar
            label={cohortB.label}
            pct={cohortB.adherence}
            color="var(--success)"
          />
        </div>
      </section>

      {/* ── Summary stats table ── */}
      <section
        className="rounded-xl border overflow-hidden"
        style={{
          background: "var(--surface-raised)",
          borderColor: "var(--border-subtle)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {/* Table header */}
        <div
          className="grid grid-cols-3 px-5 py-3 text-xs font-semibold uppercase tracking-wider"
          style={{
            borderBottom: "1px solid var(--border-subtle)",
            color: "var(--text-tertiary)",
          }}
        >
          <span>Metric</span>
          <span
            className="text-center flex items-center justify-center gap-1.5"
            style={{ color: "var(--brand)" }}
          >
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: "var(--brand)", color: "var(--text-inverse)" }}
            >
              A
            </span>
            {cohortA.label}
          </span>
          <span
            className="text-center flex items-center justify-center gap-1.5"
            style={{ color: "var(--success)" }}
          >
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: "var(--success)", color: "var(--text-inverse)" }}
            >
              B
            </span>
            {cohortB.label}
          </span>
        </div>

        {summaryRows.map((row, i) => (
          <div
            key={row.label}
            className="grid grid-cols-3 px-5 py-3 text-sm"
            style={{
              borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)",
            }}
          >
            <span style={{ color: "var(--text-secondary)" }}>{row.label}</span>
            <span className="text-center font-semibold" style={{ color: "var(--text-primary)" }}>
              {row.a}
            </span>
            <span className="text-center font-semibold" style={{ color: "var(--text-primary)" }}>
              {row.b}
            </span>
          </div>
        ))}
      </section>

    </div>
  );
}
