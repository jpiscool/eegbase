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

export function BandPowerChart({ data }: { data: BandPoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showNorms, setShowNorms] = useState(true);

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

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={900}
        height={180}
        className="w-full rounded-lg"
        style={{ height: 180, display: "block" }}
      />
      <div className="flex flex-wrap items-center gap-4 mt-3">
        {BANDS.map((b) => (
          <span key={b.key} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span
              className="inline-block w-4 h-0.5 rounded-full"
              style={{ backgroundColor: b.color }}
            />
            {b.label}
          </span>
        ))}
        <button
          onClick={() => setShowNorms((v) => !v)}
          className={`ml-auto text-xs px-2.5 py-1 rounded-md border transition-colors ${
            showNorms
              ? "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
              : "bg-white text-gray-400 border-gray-200 hover:bg-gray-50"
          }`}
        >
          {showNorms ? "Hide norms" : "Show norms"}
        </button>
      </div>
    </div>
  );
}
