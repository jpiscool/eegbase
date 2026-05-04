"use client";
import { useRef, useEffect } from "react";

interface FNIRSPoint {
  timestampMs: number;
  oxyHbLeft: number | null;
  oxyHbRight: number | null;
  deoxyHbLeft: number | null;
  deoxyHbRight: number | null;
}

const SERIES = [
  { key: "oxyHbLeft" as const, label: "OxyHb Left", color: "#EF4444", dash: [] },
  { key: "oxyHbRight" as const, label: "OxyHb Right", color: "#F97316", dash: [4, 3] },
  { key: "deoxyHbLeft" as const, label: "DeoxyHb Left", color: "#6366F1", dash: [] },
  { key: "deoxyHbRight" as const, label: "DeoxyHb Right", color: "#8B5CF6", dash: [4, 3] },
];

export function FNIRSChart({ data }: { data: FNIRSPoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const padL = 44, padR = 16, padT = 12, padB = 28;
    const innerW = w - padL - padR;
    const innerH = h - padT - padB;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, w, h);

    if (data.length < 2) return;

    const maxMs = data[data.length - 1].timestampMs;

    // Collect all non-null values to scale Y
    const allVals: number[] = [];
    for (const d of data) {
      for (const s of SERIES) {
        const v = d[s.key];
        if (v != null) allVals.push(v);
      }
    }
    if (allVals.length === 0) return;

    const minVal = Math.min(...allVals);
    const maxVal = Math.max(...allVals);
    const range = maxVal - minVal || 1;
    const pad = range * 0.1;

    const xS = (ms: number) => padL + (ms / maxMs) * innerW;
    const yS = (v: number) =>
      padT + innerH - ((v - (minVal - pad)) / (range + 2 * pad)) * innerH;

    // Grid lines (4 horizontal)
    ctx.font = "9px Inter, system-ui";
    ctx.textAlign = "right";
    ctx.fillStyle = "#94A3B8";
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
      const v = minVal - pad + ((range + 2 * pad) / 3) * i;
      const ry = yS(v);
      ctx.beginPath();
      ctx.moveTo(padL, ry);
      ctx.lineTo(padL + innerW, ry);
      ctx.stroke();
      ctx.fillText(v.toFixed(2), padL - 5, ry + 3.5);
    }
    ctx.setLineDash([]);

    // Zero line if visible
    if (minVal - pad < 0 && maxVal + pad > 0) {
      const ry = yS(0);
      ctx.setLineDash([]);
      ctx.strokeStyle = "#CBD5E1";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(padL, ry);
      ctx.lineTo(padL + innerW, ry);
      ctx.stroke();
    }

    // Draw each series
    for (const s of SERIES) {
      const pts = data
        .map((d) => ({ ms: d.timestampMs, v: d[s.key] }))
        .filter((p): p is { ms: number; v: number } => p.v != null);

      if (pts.length < 2) continue;

      ctx.beginPath();
      ctx.setLineDash(s.dash);
      pts.forEach((p, i) => {
        const x = xS(p.ms);
        const y = yS(p.v);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = "round";
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Time axis
    const totalMinutes = Math.ceil(maxMs / 60000);
    ctx.fillStyle = "#94A3B8";
    ctx.font = "9px Inter, system-ui";
    ctx.textAlign = "center";
    const labelStep = totalMinutes <= 10 ? 1 : totalMinutes <= 20 ? 2 : 5;
    for (let m = 0; m <= totalMinutes; m += labelStep) {
      const ms = m * 60000;
      if (ms > maxMs + 5000) continue;
      const x = xS(Math.min(ms, maxMs));
      ctx.fillText(`${m}m`, x, padT + innerH + 16);
    }
  }, [data]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={900}
        height={200}
        className="w-full rounded-lg"
        style={{ height: 200, display: "block" }}
      />
      <div className="flex flex-wrap gap-4 mt-3">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
            <span
              className="inline-block w-5 border-t-2"
              style={{
                borderColor: s.color,
                borderStyle: s.dash.length ? "dashed" : "solid",
              }}
            />
            {s.label}
          </span>
        ))}
      </div>
      <p className="text-xs mt-1.5" style={{ color: "var(--text-tertiary)" }}>
        Values in μM (micromolar). Positive OxyHb with negative DeoxyHb indicates increased cerebral oxygenation.
      </p>
    </div>
  );
}
