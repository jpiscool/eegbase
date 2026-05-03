"use client";

interface Props {
  score: number | null;
  threshold?: number;
}

function getColor(score: number): string {
  if (score >= 70) return "#10B981";
  if (score >= 40) return "#F59E0B";
  return "#EF4444";
}

function getLabel(score: number): string {
  if (score >= 80) return "Peak engagement";
  if (score >= 70) return "Great — above target";
  if (score >= 55) return "On track";
  if (score >= 40) return "Building up…";
  return "Below target";
}

export function GameFeedback({ score, threshold = 50 }: Props) {
  const s = score ?? 0;
  const color = score == null ? "#CBD5E1" : getColor(s);
  const label = score == null ? "Waiting for signal…" : getLabel(s);

  // Orb diameter: 80px at 0 → 240px at 100
  const minDiam = 80;
  const maxDiam = 240;
  const diam = score == null ? minDiam : minDiam + ((s / 100) * (maxDiam - minDiam));

  // Pulse speed: 4s at 0 → 0.6s at 100
  const pulseSpeed = score == null ? 3 : Math.max(0.6, 4 - (s / 100) * 3.4);

  // Ring size (outer glow ring): orb + 32–80px
  const ringDiam = diam + 32 + (s / 100) * 48;

  const aboveThreshold = score != null && s >= threshold;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 360,
        userSelect: "none",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes orb-pulse {
          0%, 100% { transform: scale(1); opacity: 0.18; }
          50% { transform: scale(1.18); opacity: 0.05; }
        }
        @keyframes orb-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
      `}</style>

      {/* Outer glow ring */}
      <div
        style={{
          position: "absolute",
          width: ringDiam,
          height: ringDiam,
          borderRadius: "50%",
          background: color,
          opacity: 0,
          animation: `orb-pulse ${pulseSpeed}s ease-in-out infinite`,
          transition: "width 0.6s ease, height 0.6s ease, background 0.6s ease",
        }}
      />

      {/* Second glow ring (offset phase) */}
      {aboveThreshold && (
        <div
          style={{
            position: "absolute",
            width: ringDiam * 0.75,
            height: ringDiam * 0.75,
            borderRadius: "50%",
            background: color,
            opacity: 0,
            animation: `orb-pulse ${pulseSpeed * 0.7}s ease-in-out infinite`,
            animationDelay: `${pulseSpeed * 0.35}s`,
            transition: "all 0.6s ease",
          }}
        />
      )}

      {/* Core orb */}
      <div
        style={{
          position: "relative",
          width: diam,
          height: diam,
          borderRadius: "50%",
          background: `radial-gradient(circle at 38% 36%, ${color}dd, ${color}88)`,
          boxShadow: `0 0 ${diam * 0.4}px ${color}55, 0 0 ${diam * 0.15}px ${color}99`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          animation: `orb-breathe ${pulseSpeed * 1.4}s ease-in-out infinite`,
          transition: "width 0.5s ease, height 0.5s ease, background 0.5s ease, box-shadow 0.5s ease",
          zIndex: 1,
        }}
      >
        <span
          style={{
            fontSize: diam * 0.28,
            fontWeight: 800,
            color: "white",
            letterSpacing: "-0.04em",
            lineHeight: 1,
            textShadow: "0 2px 12px rgba(0,0,0,0.25)",
            transition: "font-size 0.5s ease",
          }}
        >
          {score == null ? "—" : Math.round(s)}
        </span>
        <span
          style={{
            fontSize: Math.max(10, diam * 0.09),
            color: "rgba(255,255,255,0.75)",
            fontWeight: 600,
            marginTop: 2,
          }}
        >
          / 100
        </span>
      </div>

      {/* Label */}
      <p
        style={{
          marginTop: 28,
          fontSize: 15,
          fontWeight: 600,
          color,
          transition: "color 0.5s ease",
          zIndex: 1,
          letterSpacing: "-0.01em",
        }}
      >
        {label}
      </p>

      {/* Threshold indicator */}
      {threshold > 0 && (
        <p style={{ marginTop: 6, fontSize: 12, color: "#94A3B8", zIndex: 1 }}>
          Target threshold: {threshold}
        </p>
      )}
    </div>
  );
}
