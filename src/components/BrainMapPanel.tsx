"use client";

interface Props {
  oxyHbLeft: number | null;
  oxyHbRight: number | null;
  deoxyHbLeft?: number | null;
  deoxyHbRight?: number | null;
  alpha: number | null;
  theta: number | null;
  beta: number | null;
  title?: string;
}

function lerp(t: number, lo: number, hi: number) {
  return lo + t * (hi - lo);
}

function oxyColor(val: number | null): string {
  if (val == null) return "var(--border-default)";
  const t = Math.min(1, Math.max(0, val + 0.5));
  // blue (0,100,255) → green (0,200,100) → red (255,60,60)
  if (t < 0.5) {
    const s = t * 2;
    return `rgb(${Math.round(lerp(s, 0, 0))}, ${Math.round(lerp(s, 100, 200))}, ${Math.round(lerp(s, 255, 100))})`;
  } else {
    const s = (t - 0.5) * 2;
    return `rgb(${Math.round(lerp(s, 0, 255))}, ${Math.round(lerp(s, 200, 60))}, ${Math.round(lerp(s, 100, 60))})`;
  }
}

function bandColor(val: number | null): string {
  if (val == null) return "var(--border-default)";
  const t = Math.min(1, Math.max(0, val));
  return `rgb(${Math.round(lerp(t, 0, 255))}, ${Math.round(lerp(t, 100, 60))}, ${Math.round(lerp(t, 255, 60))})`;
}

function fmtOxy(v: number | null) {
  if (v == null) return "—";
  return (v >= 0 ? "+" : "") + v.toFixed(3);
}

function fmtBand(v: number | null) {
  if (v == null) return "—";
  return v.toFixed(2);
}

export function BrainMapPanel({
  oxyHbLeft,
  oxyHbRight,
  alpha,
  theta,
  beta,
  title = "Brain Activity Map",
}: Props) {
  const colorL = oxyColor(oxyHbLeft);
  const colorR = oxyColor(oxyHbRight);
  const colorAlpha = bandColor(alpha);
  const colorTheta = bandColor(theta);
  const colorBeta = bandColor(beta);

  return (
    <div
      className="rounded-xl border p-5"
      style={{ background: "var(--surface-raised)" }}
    >
      {title && (
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-4"
          style={{ color: "var(--text-tertiary)" }}
        >
          {title}
        </p>
      )}

      <svg
        viewBox="0 0 200 240"
        width="100%"
        style={{ display: "block", maxWidth: 220, margin: "0 auto" }}
        aria-label="Brain activity map"
      >
        {/* Head outline */}
        <ellipse
          cx="100"
          cy="120"
          rx="85"
          ry="105"
          fill="none"
          stroke="var(--border-default)"
          strokeWidth="2"
        />

        {/* Prefrontal Left — OxyHb Left */}
        <ellipse cx="65" cy="50" rx="28" ry="20" fill={colorL} opacity="0.7">
          <title>Prefrontal Left · OxyHb: {fmtOxy(oxyHbLeft)}</title>
        </ellipse>
        <text x="65" y="52" textAnchor="middle" fontSize="8" fill="white" fontWeight="600">
          {fmtOxy(oxyHbLeft)}
        </text>

        {/* Prefrontal Right — OxyHb Right */}
        <ellipse cx="135" cy="50" rx="28" ry="20" fill={colorR} opacity="0.7">
          <title>Prefrontal Right · OxyHb: {fmtOxy(oxyHbRight)}</title>
        </ellipse>
        <text x="135" y="52" textAnchor="middle" fontSize="8" fill="white" fontWeight="600">
          {fmtOxy(oxyHbRight)}
        </text>

        {/* Occipital — Alpha */}
        <ellipse cx="100" cy="195" rx="35" ry="22" fill={colorAlpha} opacity="0.7">
          <title>Occipital · Alpha: {fmtBand(alpha)}</title>
        </ellipse>
        <text x="100" y="197" textAnchor="middle" fontSize="8" fill="white" fontWeight="600">
          {fmtBand(alpha)}
        </text>

        {/* Temporal Left — Theta */}
        <ellipse cx="25" cy="120" rx="22" ry="30" fill={colorTheta} opacity="0.7">
          <title>Temporal Left · Theta: {fmtBand(theta)}</title>
        </ellipse>
        <text x="25" y="122" textAnchor="middle" fontSize="8" fill="white" fontWeight="600">
          {fmtBand(theta)}
        </text>

        {/* Temporal Right — Theta */}
        <ellipse cx="175" cy="120" rx="22" ry="30" fill={colorTheta} opacity="0.7">
          <title>Temporal Right · Theta: {fmtBand(theta)}</title>
        </ellipse>
        <text x="175" y="122" textAnchor="middle" fontSize="8" fill="white" fontWeight="600">
          {fmtBand(theta)}
        </text>

        {/* Frontal Midline — Beta */}
        <ellipse cx="100" cy="35" rx="18" ry="12" fill={colorBeta} opacity="0.7">
          <title>Frontal Midline · Beta: {fmtBand(beta)}</title>
        </ellipse>
        <text x="100" y="37" textAnchor="middle" fontSize="8" fill="white" fontWeight="600">
          {fmtBand(beta)}
        </text>
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 mt-3">
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: "linear-gradient(90deg, rgb(0,100,255), rgb(0,200,100), rgb(255,60,60))" }}
          />
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>OxyHb</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ background: colorAlpha }} />
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Alpha</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ background: colorTheta }} />
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Theta</span>
        </div>
      </div>
    </div>
  );
}
