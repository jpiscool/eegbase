"use client";
import { useRef, useEffect } from "react";

interface DayCount {
  date: string; // "YYYY-MM-DD"
  count: number;
}

export function DailyActivityChart({ data }: { data: DayCount[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const padL = 28, padR = 12, padT = 10, padB = 28;
    const innerW = w - padL - padR;
    const innerH = h - padT - padB;

    ctx.clearRect(0, 0, w, h);

    if (data.length === 0) return;

    const maxCount = Math.max(...data.map((d) => d.count), 1);
    const barW = Math.max(4, (innerW / data.length) - 3);

    // Grid line at maxCount
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1;
    const topY = padT;
    ctx.beginPath();
    ctx.moveTo(padL, topY);
    ctx.lineTo(padL + innerW, topY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#94A3B8";
    ctx.font = "9px Inter, system-ui";
    ctx.textAlign = "right";
    ctx.fillText(String(maxCount), padL - 4, topY + 3.5);
    ctx.fillText("0", padL - 4, padT + innerH + 3.5);

    // Bars
    data.forEach((d, i) => {
      const x = padL + i * (innerW / data.length);
      const barH = (d.count / maxCount) * innerH;
      const y = padT + innerH - barH;

      const isToday = d.date === new Date().toISOString().split("T")[0];

      ctx.fillStyle = d.count === 0
        ? "#F1F5F9"
        : isToday
        ? "#1D4ED8"
        : "#3B82F6";

      ctx.beginPath();
      ctx.roundRect(x + 1, d.count === 0 ? padT + innerH - 2 : y, barW, d.count === 0 ? 2 : barH, 3);
      ctx.fill();

      // Date labels: every 7th day and last
      if (i % 7 === 0 || i === data.length - 1) {
        const date = new Date(d.date + "T12:00:00"); // noon to avoid timezone shift
        ctx.fillStyle = "#94A3B8";
        ctx.textAlign = "center";
        ctx.font = "9px Inter, system-ui";
        ctx.fillText(
          date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          x + barW / 2,
          padT + innerH + 16
        );
      }
    });
  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      width={900}
      height={120}
      className="w-full"
      style={{ height: 120, display: "block" }}
    />
  );
}
