"use client";

interface Props {
  score: number | null;
  threshold: number;
}

function getZoneLabel(score: number, threshold: number): string {
  if (score < threshold) return "Overcast";
  if (score < 55) return "Partly Cloudy";
  if (score < 70) return "Clearing Up";
  if (score < 85) return "Sunny";
  return "Crystal Clear";
}

export function VideoFeedback({ score, threshold }: Props) {
  if (score === null) {
    return (
      <div
        style={{
          width: "100%",
          height: "220px",
          background: "var(--surface-sunken, #111)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "12px",
        }}
      >
        <span
          style={{
            color: "var(--text-tertiary, #666)",
            fontSize: "1.1rem",
            fontStyle: "italic",
          }}
        >
          Connecting...
        </span>
      </div>
    );
  }

  const s = Math.max(0, Math.min(100, score));
  const t = Math.max(0, Math.min(100, threshold));

  // Sky gradient: low → stormy gray, mid → cloudy blue, high → clear sky blue
  let skyTop: string;
  let skyBottom: string;
  if (s < t) {
    // Stormy gray
    const mix = s / Math.max(1, t);
    const gray = Math.round(60 + mix * 40);
    skyTop = `rgb(${gray}, ${gray + 5}, ${gray + 10})`;
    skyBottom = `rgb(${gray + 20}, ${gray + 22}, ${gray + 25})`;
  } else if (s < 55) {
    // Cloudy blue
    skyTop = "rgb(110, 130, 160)";
    skyBottom = "rgb(160, 175, 195)";
  } else if (s < 70) {
    // Clearing up
    skyTop = "rgb(80, 140, 200)";
    skyBottom = "rgb(150, 195, 230)";
  } else if (s < 85) {
    // Sunny
    skyTop = "rgb(50, 120, 210)";
    skyBottom = "rgb(120, 185, 240)";
  } else {
    // Crystal clear
    skyTop = "rgb(30, 100, 200)";
    skyBottom = "rgb(100, 175, 255)";
  }

  // Sun: rises from near-bottom-left (low score) to top-right (high score)
  // cx: 60 → 340 (left to right), cy: 190 → 30 (bottom to top)
  const sunProgress = s / 100;
  const sunCx = 60 + sunProgress * 280;
  const sunCy = 195 - sunProgress * 165;
  const sunR = 18 + sunProgress * 10;

  // Sun color: pale yellow → bright yellow
  const sunR_val = Math.round(200 + sunProgress * 55);
  const sunG_val = Math.round(160 + sunProgress * 70);
  const sunB_val = Math.round(80 - sunProgress * 60);
  const sunColor = `rgb(${sunR_val}, ${sunG_val}, ${Math.max(20, sunB_val)})`;
  const sunGlowOpacity = 0.15 + sunProgress * 0.3;

  // Cloud animation speed: slower at low score, faster at high score
  const cloudDuration1 = Math.max(4, 18 - s * 0.14);
  const cloudDuration2 = Math.max(5, 22 - s * 0.16);
  const cloudDuration3 = Math.max(6, 26 - s * 0.18);

  // Cloud opacity: more opaque at low score (overcast), more transparent when clear
  const cloudOpacity = Math.max(0.08, 0.85 - sunProgress * 0.75);

  const zoneLabel = getZoneLabel(s, t);

  return (
    <div style={{ width: "100%", position: "relative", borderRadius: "12px", overflow: "hidden" }}>
      <style>{`
        @keyframes cloudDrift1 {
          0%   { transform: translateX(-120px); }
          100% { transform: translateX(480px); }
        }
        @keyframes cloudDrift2 {
          0%   { transform: translateX(480px); }
          100% { transform: translateX(-120px); }
        }
        @keyframes cloudDrift3 {
          0%   { transform: translateX(-80px); }
          100% { transform: translateX(480px); }
        }
        .vf-cloud1 {
          animation: cloudDrift1 linear infinite;
          animation-duration: ${cloudDuration1.toFixed(1)}s;
        }
        .vf-cloud2 {
          animation: cloudDrift2 linear infinite;
          animation-duration: ${cloudDuration2.toFixed(1)}s;
        }
        .vf-cloud3 {
          animation: cloudDrift3 linear infinite;
          animation-duration: ${cloudDuration3.toFixed(1)}s;
        }
      `}</style>

      <svg
        viewBox="0 0 400 220"
        width="100%"
        height="220"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block" }}
      >
        <defs>
          <linearGradient id="vf-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={skyTop} />
            <stop offset="100%" stopColor={skyBottom} />
          </linearGradient>
          <radialGradient id="vf-sun-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={sunColor} stopOpacity={sunGlowOpacity} />
            <stop offset="100%" stopColor={sunColor} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Sky background */}
        <rect x="0" y="0" width="400" height="220" fill="url(#vf-sky)" />

        {/* Sun glow halo */}
        <circle
          cx={sunCx}
          cy={sunCy}
          r={sunR * 2.8}
          fill="url(#vf-sun-glow)"
        />

        {/* Sun disc */}
        <circle cx={sunCx} cy={sunCy} r={sunR} fill={sunColor} />

        {/* Ground strip */}
        <rect x="0" y="200" width="400" height="20" fill="rgb(80,110,70)" opacity="0.6" />
        <rect x="0" y="210" width="400" height="10" fill="rgb(60,90,55)" opacity="0.5" />

        {/* Cloud 1 — large, mid-height */}
        <g className="vf-cloud1" opacity={cloudOpacity}>
          <ellipse cx="80" cy="80" rx="45" ry="22" fill="white" />
          <ellipse cx="105" cy="68" rx="30" ry="20" fill="white" />
          <ellipse cx="55" cy="72" rx="25" ry="16" fill="white" />
        </g>

        {/* Cloud 2 — smaller, high */}
        <g className="vf-cloud2" opacity={cloudOpacity * 0.85}>
          <ellipse cx="300" cy="45" rx="32" ry="14" fill="white" />
          <ellipse cx="322" cy="36" rx="20" ry="13" fill="white" />
          <ellipse cx="280" cy="40" rx="18" ry="11" fill="white" />
        </g>

        {/* Cloud 3 — medium, low */}
        <g className="vf-cloud3" opacity={cloudOpacity * 0.7}>
          <ellipse cx="200" cy="115" rx="38" ry="16" fill="white" />
          <ellipse cx="225" cy="105" rx="24" ry="15" fill="white" />
          <ellipse cx="178" cy="110" rx="20" ry="13" fill="white" />
        </g>

        {/* Score number — large, center */}
        <text
          x="200"
          y="118"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="56"
          fontWeight="700"
          fontFamily="'Inter', system-ui, sans-serif"
          fill="white"
          style={{ textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}
          opacity="0.92"
        >
          {Math.round(s)}
        </text>

        {/* Zone label below score */}
        <text
          x="200"
          y="152"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="15"
          fontWeight="500"
          fontFamily="'Inter', system-ui, sans-serif"
          fill="white"
          opacity="0.82"
          letterSpacing="0.06em"
        >
          {zoneLabel.toUpperCase()}
        </text>
      </svg>
    </div>
  );
}
