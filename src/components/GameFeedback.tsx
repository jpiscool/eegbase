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
  if (score < 85) return "Great";
  return "Peak";
}

export function GameFeedback({ score, threshold }: Props) {
  const s = score ?? 0;
  const color = score == null ? "#94A3B8" : orbColor(s);

  // Orb diameter: lerp from 60 (score=0) to 220 (score=100)
  const diam = score == null ? 60 : 60 + (s / 100) * (220 - 60);

  // Pulse animation duration: 4s at 0, faster at higher scores
  const pulseDuration = score == null ? 4 : Math.max(0.64, 4 - s * 0.032);

  const label = score == null ? "—" : String(Math.round(s));
  const zone = score == null ? "" : zoneLabel(s, threshold);

  return (
    <div
      style={{
        width: "100%",
        background: "var(--surface-raised)",
      }}
    >
      <style>{`
        @keyframes pulse-ring {
          0% { opacity: 0.4; r: ${(diam / 2 + 4).toFixed(1)}; }
          100% { opacity: 0; r: ${(diam / 2 + 28).toFixed(1)}; }
        }
      `}</style>

      <svg
        viewBox="0 0 300 300"
        width="100%"
        style={{ display: "block" }}
        aria-label={`Neurofeedback score: ${label}`}
      >
        {/* Defs for pulsing ring keyframes scoped to this SVG instance */}
        <defs>
          <style>{`
            .pulse-ring-${Math.round(s)} {
              animation: pulse-ring-anim-${Math.round(s)} ${pulseDuration.toFixed(3)}s ease-out infinite;
            }
            @keyframes pulse-ring-anim-${Math.round(s)} {
              0% { opacity: 0.4; }
              100% { opacity: 0; }
            }
          `}</style>
        </defs>

        {/* Pulsing outer ring — dashed circle */}
        <circle
          cx="150"
          cy="150"
          r={diam / 2 + 16}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeDasharray="6 5"
          opacity="0.4"
          style={{
            animation: `pulse-ring ${pulseDuration.toFixed(3)}s ease-out infinite`,
            transformOrigin: "150px 150px",
          }}
        />

        {/* Core orb */}
        <circle
          cx="150"
          cy="150"
          r={diam / 2}
          fill={color}
        />

        {/* Score text */}
        <text
          x="150"
          y="150"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={Math.max(18, diam * 0.3)}
          fontWeight="bold"
          fill="white"
        >
          {label}
        </text>

        {/* Zone label below score */}
        {zone && (
          <text
            x="150"
            y={150 + diam / 2 + 20}
            textAnchor="middle"
            fontSize="13"
            fontWeight="600"
            fill={color}
          >
            {zone}
          </text>
        )}
      </svg>
    </div>
  );
}
