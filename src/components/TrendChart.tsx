"use client";
import { useRef, useEffect, useState } from "react";

interface Point {
  score: number | null;
  date: Date;
}

// Linear regression over indexed points (x = session index, y = score)
function linearRegression(points: { x: number; y: number }[]): { slope: number; intercept: number } | null {
  const n = points.length;
  if (n < 3) return null;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return null;
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

// Compute standard deviation of residuals (for confidence interval band)
function residualSD(points: { x: number; y: number }[], slope: number, intercept: number): number {
  if (points.length < 2) return 0;
  const sse = points.reduce((s, p) => {
    const predicted = slope * p.x + intercept;
    return s + (p.y - predicted) ** 2;
  }, 0);
  return Math.sqrt(sse / points.length);
}

export function TrendChart({ data, showForecast: showForecastProp }: { data: Point[]; showForecast?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showForecast, setShowForecast] = useState(showForecastProp ?? false);

  // Build valid indexed points for regression
  const validPoints: { x: number; y: number; idx: number }[] = [];
  data.forEach((d, i) => {
    if (d.score != null) validPoints.push({ x: i, y: d.score, idx: i });
  });

  const regression = validPoints.length >= 3 ? linearRegression(validPoints.map(p => ({ x: p.x, y: p.y }))) : null;
  const sd = regression ? residualSD(validPoints.map(p => ({ x: p.x, y: p.y })), regression.slope, regression.intercept) : 0;

  // How many forecast steps to project
  const forecastSteps = validPoints.length >= 3 ? Math.min(Math.floor(validPoints.length / 2), 10) : 0;
  const lastIdx = validPoints.length > 0 ? validPoints[validPoints.length - 1].x : 0;

  // Forecast x indices (starting right after the last real data point)
  const forecastXs: number[] = [];
  for (let i = 1; i <= forecastSteps; i++) {
    forecastXs.push(lastIdx + i);
  }

  // Projected score after 10 more sessions
  const tenSessionForecast = regression
    ? Math.min(100, Math.max(0, regression.slope * (lastIdx + 10) + regression.intercept))
    : null;

  const finalForecastVal = regression && forecastXs.length > 0
    ? Math.min(100, Math.max(0, regression.slope * forecastXs[forecastXs.length - 1] + regression.intercept))
    : null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Total x slots = real data + forecast slots (when enabled)
    const totalSlots = showForecast && forecastXs.length > 0
      ? lastIdx + forecastSteps
      : data.length - 1;

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
    // X axis uses totalSlots so forecast extends the chart naturally
    const xScale = (i: number) => padL + (i / Math.max(totalSlots, 1)) * innerW;

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

    // Forecast region: confidence interval band + dashed line
    if (showForecast && regression && forecastXs.length > 0) {
      const fcPoints = forecastXs.map((xi) => ({
        xi,
        y: Math.min(100, Math.max(0, regression.slope * xi + regression.intercept)),
      }));
      const startX = xScale(lastIdx);
      const startY = yScale(
        Math.min(100, Math.max(0, regression.slope * lastIdx + regression.intercept))
      );

      // Confidence band (±1 SD)
      ctx.beginPath();
      // Top edge (mean + sd), left to right
      ctx.moveTo(startX, yScale(Math.min(100, regression.slope * lastIdx + regression.intercept + sd)));
      for (const pt of fcPoints) {
        ctx.lineTo(xScale(pt.xi), yScale(Math.min(100, Math.max(0, pt.y + sd))));
      }
      // Bottom edge (mean - sd), right to left
      for (let i = fcPoints.length - 1; i >= 0; i--) {
        const pt = fcPoints[i];
        ctx.lineTo(xScale(pt.xi), yScale(Math.max(0, pt.y - sd)));
      }
      ctx.lineTo(startX, yScale(Math.max(0, regression.slope * lastIdx + regression.intercept - sd)));
      ctx.closePath();
      ctx.fillStyle = "rgba(37,99,235,0.08)";
      ctx.fill();

      // Dashed forecast line
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = "rgba(37,99,235,0.6)";
      ctx.lineWidth = 1.75;
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      for (const pt of fcPoints) {
        ctx.lineTo(xScale(pt.xi), yScale(pt.y));
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Annotation at end of forecast
      if (finalForecastVal != null) {
        const endX = xScale(forecastXs[forecastXs.length - 1]);
        const endY = yScale(finalForecastVal);
        ctx.font = "bold 9px Inter, system-ui";
        ctx.textAlign = "right";
        ctx.fillStyle = "rgba(37,99,235,0.75)";
        ctx.fillText(`Projected: ~${Math.round(finalForecastVal)}`, endX - 2, endY - 5);
      }
    }

    // Gradient fill under real data line
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

    // Fill under real data line
    const lastValidPoint = [...data].reverse().find((d) => d.score != null)!;
    const lastValidIdx = data.lastIndexOf(lastValidPoint);
    const firstValidPoint = data.find((d) => d.score != null)!;
    const firstValidIdx = data.indexOf(firstValidPoint);
    ctx.lineTo(xScale(lastValidIdx), padT + innerH);
    ctx.lineTo(xScale(firstValidIdx), padT + innerH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Real data line
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

    // Dots + date labels for real data
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, showForecast]);

  // Stats callout values
  const slopeLabel = regression
    ? regression.slope > 0
      ? `+${regression.slope.toFixed(1)}`
      : regression.slope.toFixed(1)
    : null;

  const trendStatus =
    regression == null ? null
    : regression.slope > 0 ? "improving"
    : regression.slope < -0.05 ? "declining"
    : "plateaued";

  return (
    <div>
      {/* Chart header: forecast toggle */}
      <div className="flex items-center justify-end mb-2">
        <button
          onClick={() => setShowForecast((v) => !v)}
          className="text-xs px-2.5 py-1 rounded-md transition-colors"
          style={showForecast
            ? { background: "var(--surface-sunken)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }
            : { background: "var(--surface-raised)", color: "var(--text-tertiary)", border: "1px solid var(--border-subtle)" }}
        >
          {showForecast ? "Hide forecast" : "Forecast trend"}
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={900}
        height={180}
        className="w-full rounded-lg"
        style={{ height: 180, display: "block" }}
      />

      {/* Forecast stats callout */}
      {showForecast && (
        <div
          className="mt-3 rounded-lg p-3"
          style={{ background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)" }}
        >
          {validPoints.length < 3 ? (
            <p className="text-xs text-center" style={{ color: "var(--text-tertiary)" }}>
              Need at least 3 sessions to forecast
            </p>
          ) : (
            <div className="flex flex-wrap gap-4 items-start">
              {/* Current trend */}
              <div>
                <p className="text-xs mb-0.5" style={{ color: "var(--text-tertiary)" }}>
                  Current trend
                </p>
                <p className="text-sm font-semibold font-mono" style={{ color: "var(--text-primary)" }}>
                  {slopeLabel} points/session
                </p>
              </div>

              {/* Projected score */}
              <div>
                <p className="text-xs mb-0.5" style={{ color: "var(--text-tertiary)" }}>
                  Projected after 10 more sessions
                </p>
                <p className="text-sm font-semibold font-mono" style={{ color: "var(--text-primary)" }}>
                  {tenSessionForecast != null ? `~${Math.round(tenSessionForecast)}` : "—"}
                </p>
              </div>

              {/* Status badge */}
              <div className="ml-auto flex items-center">
                {trendStatus === "improving" && (
                  <span
                    className="text-sm font-semibold px-2.5 py-1 rounded-md"
                    style={{ color: "var(--success)", background: "var(--surface-raised)", border: "1px solid var(--success)" }}
                  >
                    On track ↗
                  </span>
                )}
                {trendStatus === "declining" && (
                  <span
                    className="text-sm font-semibold px-2.5 py-1 rounded-md"
                    style={{ color: "var(--danger)", background: "var(--surface-raised)", border: "1px solid var(--danger)" }}
                  >
                    Declining ↘
                  </span>
                )}
                {trendStatus === "plateaued" && (
                  <span
                    className="text-sm font-semibold px-2.5 py-1 rounded-md"
                    style={{ color: "var(--warning)", background: "var(--surface-raised)", border: "1px solid var(--warning)" }}
                  >
                    Plateaued →
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
