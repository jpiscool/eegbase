"use client";
import { useRef, useEffect } from "react";

interface LiveChartProps {
  /** Normalized values 0–1 */
  data: number[];
  color: string;
  label: string;
  height?: number;
}

export function LiveChart({ data, color, label, height = 80 }: LiveChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = "#F8FAFC";
    ctx.fillRect(0, 0, w, h);

    // Mid grid line
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, h * 0.5);
    ctx.lineTo(w, h * 0.5);
    ctx.stroke();
    ctx.setLineDash([]);

    if (data.length < 2) return;

    const step = w / (data.length - 1);
    const pad = h * 0.08;

    // Fill under line
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = i * step;
      const y = h - pad - v * (h - pad * 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo((data.length - 1) * step, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = color + "28";
    ctx.fill();

    // Line
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = i * step;
      const y = h - pad - v * (h - pad * 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke();

    // Latest dot
    const last = data[data.length - 1];
    const lx = (data.length - 1) * step;
    const ly = h - pad - last * (h - pad * 2);
    ctx.beginPath();
    ctx.arc(lx, ly, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }, [data, color]);

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </span>
      <canvas
        ref={canvasRef}
        width={600}
        height={height}
        className="w-full rounded-lg"
        style={{ height, display: "block", border: "1px solid var(--border-subtle)" }}
      />
    </div>
  );
}
