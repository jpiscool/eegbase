"use client";

// Phase 37 — Predicted trajectory chart. Sits below the existing focus
// history chart on patient detail. Shows past sessions as a solid line,
// the next 4 weeks as a dashed projection with a faded confidence band.
//
// Strict simplicity: no "73% probability" or "95% CI" jargon. Just plain
// English: "Sarah is on track to reach 90 by week 12" with a soft caveat
// about what could move it.
//
// Pure SVG, no chart library. Designed to look like a research figure but
// read like a weather forecast.

interface TrajectoryChartProps {
  // Historical focus scores, oldest → newest
  historical: number[];
  // Patient first name for the caption
  firstName: string;
  // Target the projection aims at (default 90)
  target?: number;
  // Number of future sessions to project
  projectAhead?: number;
}

const W = 600;          // SVG viewport width
const H = 200;          // SVG viewport height
const PAD_X = 36;       // left/right padding
const PAD_Y = 20;       // top/bottom padding

export function TrajectoryChart({
  historical,
  firstName,
  target = 90,
  projectAhead = 4,
}: TrajectoryChartProps) {
  if (!historical || historical.length === 0) return null;

  // Linear regression for the projection — keeps it simple and explainable.
  const n = historical.length;
  const xs = historical.map((_, i) => i);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = historical.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (historical[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;
  const predict = (i: number) => intercept + slope * i;

  // Residual standard deviation → confidence band thickness.
  let ssr = 0;
  for (let i = 0; i < n; i++) ssr += (historical[i] - predict(i)) ** 2;
  const rmse = Math.sqrt(ssr / Math.max(1, n - 2));

  // Build projected series (clamped 0-100).
  const future: number[] = [];
  for (let i = n; i < n + projectAhead; i++) {
    future.push(Math.max(0, Math.min(100, predict(i))));
  }
  const futureUpper = future.map((v, j) => Math.min(100, v + rmse * (1 + j * 0.2)));
  const futureLower = future.map((v, j) => Math.max(0, v - rmse * (1 + j * 0.2)));

  // Project where we land at the visible horizon
  const finalProjected = Math.round(future[future.length - 1] ?? predict(n + projectAhead - 1));

  // Coordinate scaling. X spans full series (historical + future). Y is 0-100.
  const totalPoints = n + projectAhead;
  const xScale = (i: number) => PAD_X + (i / Math.max(1, totalPoints - 1)) * (W - PAD_X * 2);
  const yScale = (v: number) => PAD_Y + (1 - v / 100) * (H - PAD_Y * 2);

  // Path strings
  const histPath = historical
    .map((v, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(v)}`)
    .join(" ");
  // Bridge from last historical point to first future point so the dash starts there
  const lastH = historical[historical.length - 1];
  const futPath = [
    `M ${xScale(n - 1)} ${yScale(lastH)}`,
    ...future.map((v, j) => `L ${xScale(n + j)} ${yScale(v)}`),
  ].join(" ");
  const bandTop = future.map((_, j) => `${xScale(n + j)},${yScale(futureUpper[j])}`).join(" ");
  const bandBot = future.map((_, j) => `${xScale(n + j)},${yScale(futureLower[j])}`).reverse().join(" ");
  const bandPath = `M ${xScale(n - 1)} ${yScale(lastH)} L ${bandTop} L ${bandBot} Z`;

  // Plain-English headline based on slope vs target
  const trending = slope > 0.5 ? "improving" : slope < -0.5 ? "declining" : "steady";
  const headline =
    trending === "improving" && finalProjected >= target ? `${firstName} is on track to reach ${target} by week 12.` :
    trending === "improving" ? `${firstName} is improving and should reach ${finalProjected} by week 12.` :
    trending === "declining" ? `${firstName} has slipped recently — likely to land near ${finalProjected} unless something changes.` :
    `${firstName}'s scores have been steady. The next 4 sessions should land near ${finalProjected}.`;

  return (
    <section className="mb-12">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Where {firstName} is heading</h2>
        <p className="text-xs text-gray-400">Past 12 sessions + next 4 weeks</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <p className="text-base text-gray-800 leading-relaxed mb-4">{headline}</p>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          className="block"
          role="img"
          aria-label={`Trajectory chart for ${firstName}`}
        >
          {/* Background grid — 5 horizontal lines at 0/25/50/75/100 */}
          {[0, 25, 50, 75, 100].map((g) => (
            <g key={g}>
              <line
                x1={PAD_X}
                x2={W - PAD_X}
                y1={yScale(g)}
                y2={yScale(g)}
                stroke="#F3F4F6"
                strokeWidth={1}
              />
              <text x={PAD_X - 8} y={yScale(g) + 3} fontSize={9} fill="#9CA3AF" textAnchor="end">
                {g}
              </text>
            </g>
          ))}

          {/* Target line at the chosen target value */}
          <line
            x1={PAD_X}
            x2={W - PAD_X}
            y1={yScale(target)}
            y2={yScale(target)}
            stroke="#10B981"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          <text x={W - PAD_X - 4} y={yScale(target) - 4} fontSize={9} fill="#10B981" textAnchor="end" fontWeight={600}>
            target {target}
          </text>

          {/* Confidence band for the future */}
          <path d={bandPath} fill="#2563EB" fillOpacity={0.10} />

          {/* Historical line */}
          <path d={histPath} stroke="#2563EB" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />

          {/* Projected line (dashed) */}
          <path d={futPath} stroke="#2563EB" strokeWidth={2} strokeDasharray="5 4" fill="none" strokeLinecap="round" />

          {/* Divider line at "now" */}
          <line
            x1={xScale(n - 1)}
            x2={xScale(n - 1)}
            y1={PAD_Y}
            y2={H - PAD_Y}
            stroke="#9CA3AF"
            strokeWidth={1}
            strokeDasharray="2 4"
          />
          <text x={xScale(n - 1)} y={H - 4} fontSize={9} fill="#6B7280" textAnchor="middle">today</text>
        </svg>

        <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
          The shaded area shows the range we&rsquo;d expect, given the spread in past sessions.
          Sleep, consistency, and any change in protocol can shift this — re-check after 4 more sessions.
        </p>
      </div>
    </section>
  );
}
