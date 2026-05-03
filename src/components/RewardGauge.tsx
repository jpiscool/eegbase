"use client";

/**
 * Animated arc gauge for live session reward score.
 * SVG arc from 210° to 330° (240° sweep), color-coded by zone.
 */

const R = 72; // arc radius
const CX = 96; // viewBox center x
const CY = 96; // viewBox center y
const STROKE = 12;
const START_DEG = 210;
const SWEEP = 240;

function polarToXY(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number
): string {
  const s = polarToXY(cx, cy, r, startDeg);
  const e = polarToXY(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

function zoneColor(score: number | null): string {
  if (score == null) return "#E2E8F0";
  if (score >= 70) return "#10B981"; // emerald
  if (score >= 40) return "#F59E0B"; // amber
  return "#EF4444"; // red
}

function zoneLabel(score: number | null): { label: string; sub: string } {
  if (score == null) return { label: "—", sub: "Connecting…" };
  if (score >= 80) return { label: "Excellent", sub: "Peak engagement" };
  if (score >= 70) return { label: "Great", sub: "Above target" };
  if (score >= 55) return { label: "Good", sub: "On track" };
  if (score >= 40) return { label: "Fair", sub: "Building up" };
  return { label: "Low", sub: "Below target" };
}

export function RewardGauge({ score }: { score: number | null }) {
  const pct = score != null ? Math.max(0, Math.min(100, score)) / 100 : 0;
  const endDeg = START_DEG + SWEEP * pct;

  const trackPath = describeArc(CX, CY, R, START_DEG, START_DEG + SWEEP);
  // Avoid degenerate path when score=0
  const fillPath =
    pct > 0.005 ? describeArc(CX, CY, R, START_DEG, endDeg) : null;

  const color = zoneColor(score);
  const { label, sub } = zoneLabel(score);

  // Needle dot position
  const dot = pct > 0 ? polarToXY(CX, CY, R, endDeg) : null;

  return (
    <div className="flex flex-col items-center select-none">
      <svg
        width={192}
        height={160}
        viewBox="0 0 192 160"
        aria-label={`Reward score: ${score != null ? score.toFixed(1) : "—"}`}
      >
        {/* Track */}
        <path
          d={trackPath}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={STROKE}
          strokeLinecap="round"
        />

        {/* Zones (subtle background ticks at 40 and 70) */}
        {[40, 70].map((thresh) => {
          const tickEnd = START_DEG + SWEEP * (thresh / 100);
          const tp = polarToXY(CX, CY, R, tickEnd);
          const tp2 = polarToXY(CX, CY, R - STROKE * 0.6, tickEnd);
          return (
            <line
              key={thresh}
              x1={tp.x}
              y1={tp.y}
              x2={tp2.x}
              y2={tp2.y}
              stroke="#CBD5E1"
              strokeWidth={1.5}
            />
          );
        })}

        {/* Fill arc */}
        {fillPath && (
          <path
            d={fillPath}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            style={{ transition: "stroke 0.4s ease, d 0.08s ease" }}
          />
        )}

        {/* Dot at tip */}
        {dot && (
          <circle
            cx={dot.x}
            cy={dot.y}
            r={STROKE / 2 + 1}
            fill={color}
            style={{ transition: "fill 0.4s ease" }}
          />
        )}

        {/* Center score text */}
        <text
          x={CX}
          y={CY + 6}
          textAnchor="middle"
          fontSize={30}
          fontWeight={800}
          fill={score != null ? color : "#CBD5E1"}
          fontFamily="system-ui, -apple-system, sans-serif"
          style={{ transition: "fill 0.4s ease" }}
        >
          {score != null ? Math.round(score) : "—"}
        </text>
        <text
          x={CX}
          y={CY + 22}
          textAnchor="middle"
          fontSize={10}
          fill="#94A3B8"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          / 100
        </text>

        {/* Zone label below center */}
        <text
          x={CX}
          y={CY + 40}
          textAnchor="middle"
          fontSize={12}
          fontWeight={700}
          fill={score != null ? color : "#CBD5E1"}
          fontFamily="system-ui, -apple-system, sans-serif"
          style={{ transition: "fill 0.4s ease" }}
        >
          {label}
        </text>

        {/* Scale labels */}
        <text x={26} y={144} textAnchor="middle" fontSize={9} fill="#94A3B8" fontFamily="system-ui">0</text>
        <text x={166} y={144} textAnchor="middle" fontSize={9} fill="#94A3B8" fontFamily="system-ui">100</text>
        <text x={CX} y={155} textAnchor="middle" fontSize={9} fill="#94A3B8" fontFamily="system-ui">{sub}</text>
      </svg>
    </div>
  );
}
