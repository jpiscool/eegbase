"use client";

interface Props {
  score: number | null;
  threshold: number;
}

function orbColor(score: number): string {
  if (score < 40) return "#EF4444";
  if (score < 70) return "#F59E0B";
  return "#10B981";
}

function zoneLabel(score: number, threshold: number): string {
  if (score < threshold) return "Below target";
  if (score < 55) return "Building up";
  if (score < 70) return "On track";
  if (score < 85) return "Great  ✦";
  return "Peak  ✦✦";
}

export function GameFeedback({ score, threshold }: Props) {
  const s = score ?? 0;
  const color = score == null ? "#94A3B8" : orbColor(s);
  const isPeak = score != null && s >= 70;

  // Orb diameter: lerp from 60 (score=0) to 220 (score=100)
  const diam = score == null ? 60 : 60 + (s / 100) * (220 - 60);

  // Pulse duration: 4s at 0 → 0.64s at 100
  const pulseDuration = score == null ? 4 : Math.max(0.64, 4 - s * 0.032);

  const label = score == null ? "—" : String(Math.round(s));
  const zone = score == null ? "" : zoneLabel(s, threshold);

  return (
    <div style={{ width: "100%", background: "#0F172A", borderRadius: 12, position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes orbPulse { 0% { opacity: 0.5; } 100% { opacity: 0; transform: scale(1.6); } }
        @keyframes orbPulse2 { 0% { opacity: 0.3; } 100% { opacity: 0; transform: scale(1.9); } }
        @keyframes starSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* Ambient glow behind orb */}
      <div style={{
        position: "absolute", left: "50%", top: "50%",
        transform: "translate(-50%, -50%)",
        width: diam * 1.6, height: diam * 1.6,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color}30 0%, transparent 70%)`,
        transition: "width 0.5s ease, height 0.5s ease, background 1.5s ease",
        pointerEvents: "none",
      }} />

      <svg
        viewBox="0 0 300 300"
        width="100%"
        style={{ display: "block", position: "relative", zIndex: 1 }}
        aria-label={`Neurofeedback score: ${label}`}
      >
        <defs>
          <radialGradient id="orbGrad" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="white" stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Outer pulse ring 1 */}
        <circle
          cx="150" cy="150" r={diam / 2 + 14}
          fill="none" stroke={color} strokeWidth="2" strokeDasharray="8 6" opacity="0.4"
          style={{ animation: `orbPulse ${pulseDuration.toFixed(2)}s ease-out infinite`, transformOrigin: "150px 150px" }}
        />

        {/* Peak: second faster outer ring */}
        {isPeak && (
          <circle
            cx="150" cy="150" r={diam / 2 + 28}
            fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="4 8" opacity="0.25"
            style={{ animation: `orbPulse2 ${(pulseDuration * 0.7).toFixed(2)}s ease-out infinite 0.3s`, transformOrigin: "150px 150px" }}
          />
        )}

        {/* Core orb with gradient */}
        <circle cx="150" cy="150" r={diam / 2} fill="url(#orbGrad)" filter="url(#glow)" style={{ transition: "r 0.5s ease" }} />

        {/* Score text */}
        <text x="150" y="146" textAnchor="middle" dominantBaseline="central"
          fontSize={Math.max(18, diam * 0.3)} fontWeight="800" fill="white"
          style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em" }}>
          {label}
        </text>

        {/* Zone label */}
        {zone && (
          <text x="150" y={150 + diam / 2 + 22}
            textAnchor="middle" fontSize="13" fontWeight="700" fill={color}>
            {zone}
          </text>
        )}

        {/* Peak: target threshold arc */}
        <circle cx="150" cy="150" r="130" fill="none" stroke="#1E293B" strokeWidth="2"
          strokeDasharray={`${2 * Math.PI * 130 * 0.01} ${2 * Math.PI * 130 * 0.99}`}
          strokeDashoffset={`${-2 * Math.PI * 130 * (threshold / 100)}`}
          opacity="0.6" />
        <text x="150" y="22" textAnchor="middle" fontSize="9" fill="#334155" fontWeight="600">
          Target ▲ {threshold}
        </text>
      </svg>
    </div>
  );
}
