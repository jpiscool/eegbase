"use client";
import { useRef, useEffect } from "react";

interface DataPoint {
  timestampMs: number;
  rewardScore: number;
}

export function SessionReplayChart({ data }: { data: DataPoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const padL = 36, padR = 16, padT = 12, padB = 28;
    const innerW = w - padL - padR;
    const innerH = h - padT - padB;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, w, h);

    if (data.length < 2) return;

    const maxMs = data[data.length - 1].timestampMs;
    const xScale = (ms: number) => padL + (ms / maxMs) * innerW;
    const yScale = (v: number) => padT + innerH - (Math.max(0, Math.min(100, v)) / 100) * innerH;

    // Grid lines at 25, 50, 75
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1;
    ctx.font = "10px Inter, system-ui";
    ctx.textAlign = "right";
    for (const y of [25, 50, 75]) {
      const ry = yScale(y);
      ctx.beginPath();
      ctx.moveTo(padL, ry);
      ctx.lineTo(padL + innerW, ry);
      ctx.stroke();
      ctx.fillStyle = "#94A3B8";
      ctx.fillText(String(y), padL - 6, ry + 3.5);
    }
    ctx.setLineDash([]);

    // Gradient fill
    const grad = ctx.createLinearGradient(0, padT, 0, padT + innerH);
    grad.addColorStop(0, "rgba(37,99,235,0.15)");
    grad.addColorStop(1, "rgba(37,99,235,0)");

    // Build line path
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = xScale(d.timestampMs);
      const y = yScale(d.rewardScore);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    // Fill
    ctx.lineTo(xScale(maxMs), padT + innerH);
    ctx.lineTo(padL, padT + innerH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Stroke
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = xScale(d.timestampMs);
      const y = yScale(d.rewardScore);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = "#2563EB";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke();

    // Time axis labels (every minute)
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
  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      width={900}
      height={180}
      className="w-full rounded-lg"
      style={{ height: 180, display: "block" }}
    />
  );
}
