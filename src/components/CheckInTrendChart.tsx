"use client";
import { useRef, useEffect } from "react";

interface CheckInPoint {
  date: Date;
  mood: number | null;
  anxiety: number | null;
  focus: number | null;
  energy: number | null;
  sleepQuality: number | null;
}

const SERIES: { key: keyof Omit<CheckInPoint, "date">; label: string; color: string }[] = [
  { key: "mood", label: "Mood", color: "#3B82F6" },
  { key: "focus", label: "Focus", color: "#10B981" },
  { key: "anxiety", label: "Anxiety", color: "#EF4444" },
  { key: "energy", label: "Energy", color: "#F59E0B" },
  { key: "sleepQuality", label: "Sleep Q", color: "#8B5CF6" },
];

export function CheckInTrendChart({ data }: { data: CheckInPoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const padL = 32, padR = 12, padT = 12, padB = 36;
    const innerW = w - padL - padR;
    const innerH = h - padT - padB;

    ctx.clearRect(0, 0, w, h);
    if (data.length < 2) return;

    const minDate = data[0].date.getTime();
    const maxDate = data[data.length - 1].date.getTime();
    const dateRange = maxDate - minDate || 1;

    function xOf(d: Date) {
      return padL + ((d.getTime() - minDate) / dateRange) * innerW;
    }
    function yOf(v: number) {
      return padT + innerH - ((v - 1) / 9) * innerH;
    }

    // Horizontal grid lines at 1, 4, 7, 10
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1;
    ctx.fillStyle = "#94A3B8";
    ctx.font = "9px Inter, system-ui";
    ctx.textAlign = "right";
    for (const v of [1, 4, 7, 10]) {
      const y = yOf(v);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + innerW, y);
      ctx.stroke();
      ctx.fillText(String(v), padL - 4, y + 3.5);
    }
    ctx.setLineDash([]);

    // Date labels
    ctx.textAlign = "center";
    ctx.fillStyle = "#94A3B8";
    ctx.font = "9px Inter, system-ui";
    const step = Math.max(1, Math.floor(data.length / 6));
    data.forEach((d, i) => {
      if (i % step === 0 || i === data.length - 1) {
        const x = xOf(d.date);
        ctx.fillText(
          d.date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          x,
          padT + innerH + 20
        );
      }
    });

    // Series lines
    for (const { key, color } of SERIES) {
      const points = data
        .map((d) => ({ x: xOf(d.date), y: d[key] != null ? yOf(d[key] as number) : null }))
        .filter((p): p is { x: number; y: number } => p.y != null);

      if (points.length < 2) continue;

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.beginPath();
      points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();

      // Dots
      ctx.fillStyle = color;
      for (const p of points) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [data]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={900}
        height={160}
        className="w-full"
        style={{ height: 160, display: "block" }}
      />
      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 flex-wrap">
        {SERIES.map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
