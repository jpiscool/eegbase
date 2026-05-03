"use client";
import { useRef, useEffect } from "react";

interface Point {
  score: number | null;
  date: Date;
}

export function TrendChart({ data }: { data: Point[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const padL = 36, padR = 16, padT = 12, padB = 24;
    const innerW = w - padL - padR;
    const innerH = h - padT - padB;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, w, h);

    const valid = data.filter((d) => d.score != null);
    if (valid.length < 2) return;

    // Y axis: 0–100
    const yScale = (v: number) => padT + innerH - (v / 100) * innerH;
    const xScale = (i: number) => padL + (i / (data.length - 1)) * innerW;

    // Grid lines at 25, 50, 75
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1;
    for (const y of [25, 50, 75]) {
      const ry = yScale(y);
      ctx.beginPath();
      ctx.moveTo(padL, ry);
      ctx.lineTo(padL + innerW, ry);
      ctx.stroke();
      ctx.fillStyle = "#94A3B8";
      ctx.font = "10px Inter, system-ui";
      ctx.textAlign = "right";
      ctx.fillText(String(y), padL - 6, ry + 3.5);
    }
    ctx.setLineDash([]);

    // Gradient fill
    const grad = ctx.createLinearGradient(0, padT, 0, padT + innerH);
    grad.addColorStop(0, "rgba(37,99,235,0.15)");
    grad.addColorStop(1, "rgba(37,99,235,0)");

    // Build path through valid points only
    ctx.beginPath();
    let first = true;
    data.forEach((d, i) => {
      if (d.score == null) return;
      const x = xScale(i);
      const y = yScale(d.score);
      if (first) { ctx.moveTo(x, y); first = false; }
      else ctx.lineTo(x, y);
    });

    // Fill
    const lastValid = [...data].reverse().find((d) => d.score != null)!;
    const lastIdx = data.lastIndexOf(lastValid);
    const firstValid = data.find((d) => d.score != null)!;
    const firstIdx = data.indexOf(firstValid);
    ctx.lineTo(xScale(lastIdx), padT + innerH);
    ctx.lineTo(xScale(firstIdx), padT + innerH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    first = true;
    data.forEach((d, i) => {
      if (d.score == null) return;
      const x = xScale(i);
      const y = yScale(d.score);
      if (first) { ctx.moveTo(x, y); first = false; }
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = "#2563EB";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke();

    // Dots + date labels
    ctx.font = "9px Inter, system-ui";
    ctx.textAlign = "center";
    data.forEach((d, i) => {
      if (d.score == null) return;
      const x = xScale(i);
      const y = yScale(d.score);
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "#2563EB";
      ctx.fill();

      // Only label first, last, and every ~5th
      if (i === 0 || i === data.length - 1 || i % 5 === 0) {
        ctx.fillStyle = "#94A3B8";
        ctx.fillText(
          new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          x,
          padT + innerH + 16
        );
      }
    });
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
