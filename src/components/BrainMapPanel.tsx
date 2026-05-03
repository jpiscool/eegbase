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

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

// 3-stop color: blue (low OxyHb) → green (neutral) → red (high OxyHb)
// Normalizes [-0.12, +0.12] μM range to [0, 1]
function fnirsColor(val: number | null): string {
  if (val == null) return "#CBD5E1";
  const norm = Math.min(1, Math.max(0, (val + 0.12) / 0.24));
  if (norm < 0.5) {
    const t = norm * 2;
    return `rgb(${lerp(59, 16, t)},${lerp(130, 185, t)},${lerp(246, 129, t)})`;
  }
  const t = (norm - 0.5) * 2;
  return `rgb(${lerp(16, 239, t)},${lerp(185, 68, t)},${lerp(129, 68, t)})`;
}

function fnirsOpacity(val: number | null) {
  if (val == null) return 0.2;
  return Math.min(0.85, Math.max(0.2, Math.abs(val) * 7));
}

function bandOpacity(val: number | null) {
  if (val == null) return 0.15;
  return Math.min(0.85, Math.max(0.15, val * 2.5));
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
  deoxyHbLeft,
  deoxyHbRight,
  alpha,
  theta,
  beta,
  title = "Brain Activity Map",
}: Props) {
  const colorL = fnirsColor(oxyHbLeft);
  const colorR = fnirsColor(oxyHbRight);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-sm font-semibold text-gray-700 mb-5">{title}</h2>
      <div className="flex items-start gap-8 flex-wrap">
        {/* SVG Head */}
        <svg
          viewBox="0 0 280 340"
          style={{ width: "100%", maxWidth: 220, display: "block", flexShrink: 0 }}
        >
          {/* Head outline */}
          <ellipse cx="140" cy="174" rx="108" ry="128" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />

          {/* Prefrontal Left — OxyHb L */}
          <ellipse
            cx="93" cy="84" rx="40" ry="30"
            fill={colorL} opacity={fnirsOpacity(oxyHbLeft)}
          >
            <title>Prefrontal Left · OxyHb: {fmtOxy(oxyHbLeft)} μM</title>
          </ellipse>

          {/* Prefrontal Right — OxyHb R */}
          <ellipse
            cx="187" cy="84" rx="40" ry="30"
            fill={colorR} opacity={fnirsOpacity(oxyHbRight)}
          >
            <title>Prefrontal Right · OxyHb: {fmtOxy(oxyHbRight)} μM</title>
          </ellipse>

          {/* Frontal midline — Beta */}
          <ellipse
            cx="140" cy="112" rx="28" ry="22"
            fill="#EC4899" opacity={bandOpacity(beta)}
          >
            <title>Frontal midline · Beta: {fmtBand(beta)}</title>
          </ellipse>

          {/* Temporal Left — Theta */}
          <ellipse
            cx="47" cy="172" rx="30" ry="42"
            fill="#F59E0B" opacity={bandOpacity(theta)}
          >
            <title>Temporal Left · Theta: {fmtBand(theta)}</title>
          </ellipse>

          {/* Temporal Right — Theta */}
          <ellipse
            cx="233" cy="172" rx="30" ry="42"
            fill="#F59E0B" opacity={bandOpacity(theta)}
          >
            <title>Temporal Right · Theta: {fmtBand(theta)}</title>
          </ellipse>

          {/* Occipital — Alpha */}
          <ellipse
            cx="140" cy="265" rx="56" ry="34"
            fill="#8B5CF6" opacity={bandOpacity(alpha)}
          >
            <title>Occipital · Alpha: {fmtBand(alpha)}</title>
          </ellipse>

          {/* Region value labels */}
          <text x="93" y="88" textAnchor="middle" fontSize="9" fontWeight="700" fill="#1E293B">L</text>
          <text x="93" y="99" textAnchor="middle" fontSize="8" fill="#475569">{fmtOxy(oxyHbLeft)}</text>
          <text x="187" y="88" textAnchor="middle" fontSize="9" fontWeight="700" fill="#1E293B">R</text>
          <text x="187" y="99" textAnchor="middle" fontSize="8" fill="#475569">{fmtOxy(oxyHbRight)}</text>
          <text x="140" y="116" textAnchor="middle" fontSize="8" fill="#475569">{fmtBand(beta)}</text>
          <text x="47" y="176" textAnchor="middle" fontSize="8" fill="#475569">{fmtBand(theta)}</text>
          <text x="233" y="176" textAnchor="middle" fontSize="8" fill="#475569">{fmtBand(theta)}</text>
          <text x="140" y="268" textAnchor="middle" fontSize="8" fill="#475569">{fmtBand(alpha)}</text>

          {/* Region labels (outside head) */}
          <text x="140" y="48" textAnchor="middle" fontSize="9" fill="#94A3B8">Prefrontal</text>
          <text x="9" y="176" textAnchor="middle" fontSize="9" fill="#94A3B8" transform="rotate(-90, 9, 176)">Temporal</text>
          <text x="271" y="176" textAnchor="middle" fontSize="9" fill="#94A3B8" transform="rotate(90, 271, 176)">Temporal</text>
          <text x="140" y="320" textAnchor="middle" fontSize="9" fill="#94A3B8">Occipital</text>

          {/* Color scale legend bar */}
          <defs>
            <linearGradient id="oxyGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>
          </defs>
          <rect x="70" y="330" width="140" height="6" rx="3" fill="url(#oxyGrad)" />
          <text x="70" y="344" fontSize="8" fill="#94A3B8">Low</text>
          <text x="210" y="344" textAnchor="end" fontSize="8" fill="#94A3B8">High OxyHb</text>
        </svg>

        {/* Values panel */}
        <div className="flex-1 min-w-[140px]">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Metrics</p>
          <div className="space-y-2">
            {([
              { label: "OxyHb L", value: fmtOxy(oxyHbLeft), color: colorL },
              { label: "OxyHb R", value: fmtOxy(oxyHbRight), color: colorR },
              deoxyHbLeft != null ? { label: "DeoxyHb L", value: fmtOxy(deoxyHbLeft), color: "#6366F1" } : null,
              deoxyHbRight != null ? { label: "DeoxyHb R", value: fmtOxy(deoxyHbRight), color: "#6366F1" } : null,
              { label: "Alpha", value: fmtBand(alpha), color: "#8B5CF6" },
              { label: "Theta", value: fmtBand(theta), color: "#F59E0B" },
              { label: "Beta", value: fmtBand(beta), color: "#EC4899" },
            ] as ({ label: string; value: string; color: string } | null)[])
              .filter((x): x is { label: string; value: string; color: string } => x != null)
              .map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <span className="text-xs text-gray-500">{label}</span>
                  <span className="text-xs font-mono font-semibold tabular-nums" style={{ color }}>
                    {value}
                  </span>
                </div>
              ))}
          </div>

          <div className="mt-5 space-y-1.5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Legend</p>
            {[
              { color: "linear-gradient(90deg,#3B82F6,#10B981,#EF4444)", label: "OxyHb (prefrontal)", gradient: true },
              { color: "#EC4899", label: "Beta (frontal)" },
              { color: "#F59E0B", label: "Theta (temporal)" },
              { color: "#8B5CF6", label: "Alpha (occipital)" },
            ].map(({ color, label, gradient }) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{ background: gradient ? color : color }}
                />
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
