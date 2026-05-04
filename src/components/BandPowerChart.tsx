"use client";
import { useRef, useEffect, useState } from "react";

interface BandPoint {
  timestampMs: number;
  delta: number | null;
  theta: number | null;
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
}

const BANDS: Array<{ key: keyof Omit<BandPoint, "timestampMs">; label: string; color: string }> = [
  { key: "delta", label: "Delta", color: "#6366F1" },
  { key: "theta", label: "Theta", color: "#0EA5E9" },
  { key: "alpha", label: "Alpha", color: "#10B981" },
  { key: "beta", label: "Beta", color: "#F59E0B" },
  { key: "gamma", label: "Gamma", color: "#EF4444" },
];

// Normative awake resting-state ranges (normalized 0–1, relative to chart max).
// Derived from published relative EEG band power literature (eyes-open resting).
const NORMS: Record<string, { lo: number; hi: number }> = {
  delta: { lo: 0.20, hi: 0.45 },
  theta: { lo: 0.15, hi: 0.35 },
  alpha: { lo: 0.30, hi: 0.60 },
  beta:  { lo: 0.15, hi: 0.35 },
  gamma: { lo: 0.05, hi: 0.20 },
};

// Z-score normative reference values by age group (µV²/Hz, relative power %)
// Source: Thatcher et al. (2005) EEG normative database, adult norms (18-60)
const Z_SCORE_NORMS = {
  delta: { mean: 32.5, sd: 8.2, unit: "%" },   // 1-4 Hz relative power
  theta: { mean: 24.1, sd: 6.8, unit: "%" },   // 4-8 Hz relative power
  alpha: { mean: 28.4, sd: 7.3, unit: "%" },   // 8-13 Hz relative power
  beta:  { mean: 12.7, sd: 4.1, unit: "%" },   // 13-30 Hz relative power
  gamma: { mean: 2.3,  sd: 1.1, unit: "%" },   // 30-100 Hz relative power
} as const

// Compute the Z-score badge color based on |z|
function zScoreColor(z: number): string {
  const absZ = Math.abs(z);
  if (absZ > 2) return "var(--danger)";
  if (absZ > 1.5) return "var(--warning)";
  return "var(--text-secondary)";
}

// Format Z-score with sign
function formatZ(z: number): string {
  const sign = z >= 0 ? "+" : "";
  return `z=${sign}${z.toFixed(1)}`;
}

export function BandPowerChart({ data }: { data: BandPoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showNorms, setShowNorms] = useState(true);
  const [showZScores, setShowZScores] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const padL = 40, padR = 16, padT = 12, padB = 28;
    const innerW = w - padL - padR;
    const innerH = h - padT - padB;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, w, h);

    if (data.length < 2) return;

    const maxMs = data[data.length - 1].timestampMs;

    // Find max value for y-scale
    let maxVal = 1;
    for (const d of data) {
      for (const b of BANDS) {
        const v = d[b.key];
        if (v != null && v > maxVal) maxVal = v;
      }
    }

    const xScale = (ms: number) => padL + (ms / maxMs) * innerW;
    const yScale = (v: number) => padT + innerH - (v / maxVal) * innerH;

    // Grid lines
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1;
    ctx.font = "10px Inter, system-ui";
    ctx.textAlign = "right";
    ctx.fillStyle = "#94A3B8";
    for (const pct of [0.25, 0.5, 0.75, 1.0]) {
      const ry = padT + innerH * (1 - pct);
      ctx.beginPath();
      ctx.moveTo(padL, ry);
      ctx.lineTo(padL + innerW, ry);
      ctx.stroke();
      ctx.fillText((maxVal * pct).toFixed(1), padL - 5, ry + 3.5);
    }
    ctx.setLineDash([]);

    // Normative reference bands — shaded zones + dashed midpoint lines
    if (showNorms) {
      for (const band of BANDS) {
        const norm = NORMS[band.key];
        if (!norm) continue;
        const yHi = yScale(norm.hi * maxVal);
        const yLo  = yScale(norm.lo  * maxVal);
        const bandH = yLo - yHi;

        // Shaded zone
        ctx.fillStyle = band.color;
        ctx.globalAlpha = 0.07;
        ctx.fillRect(padL, yHi, innerW, bandH);
        ctx.globalAlpha = 1;

        // Midpoint dashed reference line
        const yMid = yScale(((norm.lo + norm.hi) / 2) * maxVal);
        ctx.setLineDash([4, 5]);
        ctx.strokeStyle = band.color;
        ctx.lineWidth = 0.8;
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.moveTo(padL, yMid);
        ctx.lineTo(padL + innerW, yMid);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.setLineDash([]);
      }
    }

    // Draw each band line
    for (const band of BANDS) {
      const points = data
        .map((d) => ({ ms: d.timestampMs, v: d[band.key] }))
        .filter((p): p is { ms: number; v: number } => p.v != null);

      if (points.length < 2) continue;

      ctx.beginPath();
      points.forEach((p, i) => {
        const x = xScale(p.ms);
        const y = yScale(p.v);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = band.color;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = "round";
      ctx.globalAlpha = 0.85;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Time axis labels
    const totalMinutes = Math.ceil(maxMs / 60000);
    ctx.fillStyle = "#94A3B8";
    ctx.font = "9px Inter, system-ui";
    ctx.textAlign = "center";
    const labelStep = totalMinutes <= 10 ? 1 : totalMinutes <= 20 ? 2 : 5;
    for (let m = 0; m <= totalMinutes; m += labelStep) {
      const ms = m * 60000;
      if (ms > maxMs + 5000) continue;
      const x = xScale(Math.min(ms, maxMs));
      ctx.fillText(`${m}m`, x, padT + innerH + 16);
    }
  }, [data, showNorms]);

  // Compute latest-sample average per band for Z-score display
  const latestValues: Partial<Record<keyof typeof Z_SCORE_NORMS, number>> = {};
  if (data.length > 0) {
    // Average the last 5 samples (or all if fewer) to smooth the reading
    const window = data.slice(-5);
    for (const band of BANDS) {
      const vals = window
        .map((d) => d[band.key as keyof BandPoint] as number | null)
        .filter((v): v is number => v != null);
      if (vals.length > 0) {
        latestValues[band.key as keyof typeof Z_SCORE_NORMS] =
          vals.reduce((a, b) => a + b, 0) / vals.length;
      }
    }
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={900}
        height={180}
        className="w-full rounded-lg"
        style={{ height: 180, display: "block" }}
      />

      {/* Legend row + controls */}
      <div className="flex flex-wrap items-center gap-4 mt-3">
        {BANDS.map((b) => (
          <span key={b.key} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
            <span
              className="inline-block w-4 h-0.5 rounded-full"
              style={{ backgroundColor: b.color }}
            />
            {b.label}
          </span>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowNorms((v) => !v)}
            className="text-xs px-2.5 py-1 rounded-md transition-colors"
            style={showNorms
              ? { background: "var(--surface-sunken)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }
              : { background: "var(--surface-raised)", color: "var(--text-tertiary)", border: "1px solid var(--border-subtle)" }}
          >
            {showNorms ? "Hide norms" : "Show norms"}
          </button>
          <button
            onClick={() => setShowZScores((v) => !v)}
            className="text-xs px-2.5 py-1 rounded-md transition-colors"
            style={showZScores
              ? { background: "var(--surface-sunken)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }
              : { background: "var(--surface-raised)", color: "var(--text-tertiary)", border: "1px solid var(--border-subtle)" }}
          >
            {showZScores ? "Hide Z-scores" : "Z-Scores"}
          </button>
        </div>
      </div>

      {/* Z-Score panel */}
      {showZScores && (
        <div
          className="mt-3 rounded-lg p-3"
          style={{ background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)" }}
        >
          {/* Header row */}
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
              Z-Score Analysis
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded"
              style={{
                background: "var(--surface-raised)",
                color: "var(--text-tertiary)",
                border: "1px solid var(--border-subtle)",
                fontSize: "0.65rem",
              }}
              title="Norms based on Thatcher et al. (2005) adult population ages 18–60"
            >
              Thatcher et al. adult norms (ages 18–60)
            </span>
          </div>

          {/* Band rows */}
          <div className="flex flex-col gap-1.5">
            {BANDS.map((band) => {
              const norm = Z_SCORE_NORMS[band.key as keyof typeof Z_SCORE_NORMS];
              const currentVal = latestValues[band.key as keyof typeof Z_SCORE_NORMS];
              if (currentVal == null) return null;
              const z = (currentVal - norm.mean) / norm.sd;
              const color = zScoreColor(z);
              return (
                <div key={band.key} className="flex items-center gap-2">
                  {/* Color dot */}
                  <span
                    className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: band.color }}
                  />
                  {/* Band name */}
                  <span className="text-xs w-10" style={{ color: "var(--text-secondary)" }}>
                    {band.label}
                  </span>
                  {/* Current value */}
                  <span className="text-xs font-mono w-12 text-right" style={{ color: "var(--text-primary)" }}>
                    {currentVal.toFixed(1)}{norm.unit}
                  </span>
                  {/* Z badge */}
                  <span
                    className="text-xs font-mono px-1.5 py-0.5 rounded"
                    style={{
                      color,
                      background: "var(--surface-base)",
                      border: `1px solid ${color}`,
                      opacity: 0.95,
                      fontSize: "0.68rem",
                    }}
                  >
                    {formatZ(z)}
                  </span>
                  {/* Mini bar showing deviation from mean */}
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border-subtle)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(Math.abs(z) / 3, 1) * 100}%`,
                        background: color,
                        opacity: 0.7,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Z-score key legend */}
          <div
            className="flex flex-wrap items-center gap-3 mt-3 pt-2.5"
            style={{ borderTop: "1px solid var(--border-subtle)" }}
          >
            <span className="text-xs" style={{ color: "var(--text-tertiary)", fontSize: "0.68rem" }}>
              Key:
            </span>
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-secondary)", fontSize: "0.68rem" }}>
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: "var(--text-secondary)", opacity: 0.6 }}
              />
              Normal (|z| &lt; 1.5)
            </span>
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--warning)", fontSize: "0.68rem" }}>
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: "var(--warning)" }}
              />
              Mild elevation (1.5–2)
            </span>
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--danger)", fontSize: "0.68rem" }}>
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: "var(--danger)" }}
              />
              Significant (&gt; 2)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
