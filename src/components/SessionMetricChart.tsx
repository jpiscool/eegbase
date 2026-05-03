"use client";
import { useRef, useEffect } from "react";

interface MetricSession {
  date: Date;
  pre: number | null;
  post: number | null;
}

interface Props {
  label: string;
  data: MetricSession[];
  color: string;
  invert?: boolean;
}

function Sparkline({
  values,
  color,
  width = 200,
  height = 60,
}: {
  values: Array<{ x: number; y: number | null }>;
  color: string;
  width?: number;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const padL = 4, padR = 4, padT = 8, padB = 8;
    const innerW = width - padL - padR;
    const innerH = height - padT - padB;

    ctx.clearRect(0, 0, width, height);

    const valid = values.filter((v) => v.y != null) as Array<{ x: number; y: number }>;
    if (valid.length < 2) return;

    const minY = 1, maxY = 10;
    const minX = values[0].x;
    const maxX = values[values.length - 1].x;
    const rangeX = maxX - minX || 1;

    const xS = (x: number) => padL + ((x - minX) / rangeX) * innerW;
    const yS = (y: number) => padT + innerH - ((y - minY) / (maxY - minY)) * innerH;

    // Grid at 5
    ctx.setLineDash([2, 3]);
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, yS(5));
    ctx.lineTo(padL + innerW, yS(5));
    ctx.stroke();
    ctx.setLineDash([]);

    // Pre line (dashed)
    const prePoints = values.filter((v) => v.y != null) as Array<{ x: number; y: number }>;
    if (prePoints.length >= 2) {
      ctx.beginPath();
      ctx.setLineDash([3, 3]);
      prePoints.forEach((p, i) => {
        const x = xS(p.x);
        const y = yS(p.y);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = color + "80"; // 50% opacity
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [values, color, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full"
      style={{ height, display: "block" }}
    />
  );
}

export function SessionMetricTrend({
  sessions,
}: {
  sessions: Array<{
    date: Date;
    preFocus: number | null;
    postFocus: number | null;
    preMood: number | null;
    postMood: number | null;
    preAnxiety: number | null;
    postAnxiety: number | null;
    preEnergy: number | null;
    postEnergy: number | null;
  }>;
}) {
  // Only sessions with at least one metric
  const withData = [...sessions]
    .reverse()
    .filter((s) =>
      s.preFocus != null || s.postFocus != null ||
      s.preMood != null || s.postMood != null ||
      s.preAnxiety != null || s.postAnxiety != null ||
      s.preEnergy != null || s.postEnergy != null
    );

  if (withData.length < 2) return null;

  const metrics: Array<{
    label: string;
    color: string;
    invert?: boolean;
    pairs: Array<{ date: Date; pre: number | null; post: number | null }>;
  }> = [
    {
      label: "Focus",
      color: "#2563EB",
      pairs: withData.map((s) => ({ date: s.date, pre: s.preFocus, post: s.postFocus })),
    },
    {
      label: "Mood",
      color: "#10B981",
      pairs: withData.map((s) => ({ date: s.date, pre: s.preMood, post: s.postMood })),
    },
    {
      label: "Anxiety",
      color: "#EF4444",
      invert: true,
      pairs: withData.map((s) => ({ date: s.date, pre: s.preAnxiety, post: s.postAnxiety })),
    },
    {
      label: "Energy",
      color: "#F59E0B",
      pairs: withData.map((s) => ({ date: s.date, pre: s.preEnergy, post: s.postEnergy })),
    },
  ];

  const dates = withData.map((s) => s.date.getTime());
  const minDate = Math.min(...dates);

  return (
    <div className="grid grid-cols-2 gap-5">
      {metrics.map((m) => {
        const hasAny = m.pairs.some((p) => p.pre != null || p.post != null);
        if (!hasAny) return null;

        // Most recent pre→post delta
        const last = [...m.pairs].reverse().find((p) => p.pre != null && p.post != null);
        const delta = last ? last.post! - last.pre! : null;
        const improved = m.invert ? (delta != null && delta < 0) : (delta != null && delta > 0);

        const preValues = m.pairs.map((p) => ({
          x: p.date.getTime() - minDate,
          y: p.pre,
        }));
        const postValues = m.pairs.map((p) => ({
          x: p.date.getTime() - minDate,
          y: p.post,
        }));

        return (
          <div key={m.label} className="border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-600">{m.label}</span>
              {delta != null && (
                <span
                  className={`text-xs font-medium ${
                    improved ? "text-emerald-600" : delta === 0 ? "text-gray-400" : "text-red-500"
                  }`}
                >
                  {delta > 0 ? "+" : ""}{delta} last session
                </span>
              )}
            </div>
            <MultiMetricSparkline
              preValues={preValues}
              postValues={postValues}
              color={m.color}
            />
            <div className="flex gap-3 mt-2">
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <span className="inline-block w-5 border-t-2 border-dashed" style={{ borderColor: m.color + "80" }} />
                Pre
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <span className="inline-block w-5 border-t-2" style={{ borderColor: m.color }} />
                Post
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MultiMetricSparkline({
  preValues,
  postValues,
  color,
}: {
  preValues: Array<{ x: number; y: number | null }>;
  postValues: Array<{ x: number; y: number | null }>;
  color: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const padL = 24, padR = 8, padT = 6, padB = 6;
    const innerW = w - padL - padR;
    const innerH = h - padT - padB;

    ctx.clearRect(0, 0, w, h);

    const allX = [...preValues, ...postValues].map((v) => v.x);
    const minX = Math.min(...allX);
    const maxX = Math.max(...allX);
    const rangeX = maxX - minX || 1;

    const xS = (x: number) => padL + ((x - minX) / rangeX) * innerW;
    const yS = (y: number) => padT + innerH - ((Math.max(1, Math.min(10, y)) - 1) / 9) * innerH;

    // Y-axis labels
    ctx.font = "8px Inter, system-ui";
    ctx.fillStyle = "#CBD5E1";
    ctx.textAlign = "right";
    for (const v of [1, 5, 10]) {
      ctx.fillText(String(v), padL - 4, yS(v) + 3);
    }

    // Grid at 5
    ctx.setLineDash([2, 3]);
    ctx.strokeStyle = "#F1F5F9";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, yS(5));
    ctx.lineTo(padL + innerW, yS(5));
    ctx.stroke();
    ctx.setLineDash([]);

    const drawLine = (
      values: Array<{ x: number; y: number | null }>,
      strokeColor: string,
      dash: number[]
    ) => {
      const pts = values.filter((v) => v.y != null) as Array<{ x: number; y: number }>;
      if (pts.length < 2) return;
      ctx.beginPath();
      ctx.setLineDash(dash);
      pts.forEach((p, i) => {
        const x = xS(p.x);
        const y = yS(p.y);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = "round";
      ctx.stroke();
      ctx.setLineDash([]);

      // Dots
      for (const p of pts) {
        ctx.beginPath();
        ctx.arc(xS(p.x), yS(p.y), 2.5, 0, Math.PI * 2);
        ctx.fillStyle = strokeColor;
        ctx.fill();
      }
    };

    drawLine(preValues, color + "70", [3, 3]);
    drawLine(postValues, color, []);
  }, [preValues, postValues, color]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={72}
      className="w-full rounded"
      style={{ height: 72, display: "block" }}
    />
  );
}
