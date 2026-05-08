"use client";

// Three pure-CSS visual modes that respond to the live focus score.
// No canvas, no audio, no images — opacity / hue / size driven by score
// so the user picks the one they like and gets immediate biofeedback.
//
// The score (0–100) is passed in from SessionView. Each mode is its own
// tiny renderer; the picker swaps them in place.

export type VisualMode = "aurora" | "shapes" | "bars";

export const VISUAL_MODES: { id: VisualMode; label: string; emoji: string; hint: string }[] = [
  { id: "aurora", label: "Aurora",  emoji: "\u{1F30C}", hint: "Soft glow" },
  { id: "shapes", label: "Shapes",  emoji: "\u{2728}",  hint: "Drifting circles" },
  { id: "bars",   label: "Bars",    emoji: "\u{1F39B}", hint: "Audio-style meter" },
];

interface TrainingVisualsProps {
  mode: VisualMode;
  score: number; // 0–100
}

export function TrainingVisuals({ mode, score }: TrainingVisualsProps) {
  if (mode === "shapes") return <ShapesView score={score} />;
  if (mode === "bars")   return <BarsView score={score} />;
  return <AuroraView score={score} />;
}

// ── Aurora ── radial glow whose color + size + intensity tracks the score
function AuroraView({ score }: { score: number }) {
  const t = Math.max(0, Math.min(100, score)) / 100;
  // Hue rotates from gray (low) → blue (mid) → green (high)
  const hue = 200 + t * 40;
  const size = 240 + t * 220;
  const opacity = 0.25 + t * 0.55;
  return (
    <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gray-900">
      <div
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: size,
          height: size,
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(closest-side, hsl(${hue} 80% 60% / ${opacity}), transparent 70%)`,
          filter: "blur(20px)",
          transition: "all 600ms ease-out",
        }}
        aria-hidden
      />
    </div>
  );
}

// ── Shapes ── 3 circles that drift up/down and lighten with the score
function ShapesView({ score }: { score: number }) {
  const t = Math.max(0, Math.min(100, score)) / 100;
  const shapes = [
    { left: "22%", baseTop: 80, color: "#7C3AED" },
    { left: "50%", baseTop: 50, color: "#06B6D4" },
    { left: "76%", baseTop: 100, color: "#10B981" },
  ];
  return (
    <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gray-50 border border-gray-200">
      {shapes.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: s.left,
            top: s.baseTop - t * 30,
            width: 40 + t * 36,
            height: 40 + t * 36,
            background: s.color,
            opacity: 0.20 + t * 0.50,
            transform: "translate(-50%, 0)",
            transition: "all 700ms ease-out",
            filter: "blur(2px)",
          }}
          aria-hidden
        />
      ))}
    </div>
  );
}

// ── Bars ── 16 vertical bars whose heights ride the score (audio-meter feel)
function BarsView({ score }: { score: number }) {
  const t = Math.max(0, Math.min(100, score)) / 100;
  const bars = Array.from({ length: 16 }, (_, i) => {
    // Each bar gets its own quasi-random offset so the row feels organic.
    const offset = ((i * 47) % 31) / 31;
    const heightPct = Math.max(8, Math.min(100, t * 80 + offset * 30));
    const colorStop = t > 0.7 ? "#10B981" : t > 0.4 ? "#F59E0B" : "#94A3B8";
    return { heightPct, colorStop };
  });
  return (
    <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gray-50 border border-gray-200 flex items-end gap-1.5 p-4">
      {bars.map((b, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height: `${b.heightPct}%`,
            background: b.colorStop,
            transition: "all 250ms ease-out",
          }}
          aria-hidden
        />
      ))}
    </div>
  );
}
