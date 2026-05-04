"use client";

import { useRef, useEffect } from "react";

interface Props {
  alpha: number | null;
  theta: number | null;
  beta: number | null;
  score: number | null;
}

// Ring definitions: color, base radius, speed multiplier, phase offset
const RINGS = [
  { color: "#6366F1", baseRadius: 140, speed: 0.007, phase: 0.0 },   // outermost — delta-ish
  { color: "#0EA5E9", baseRadius: 108, speed: 0.013, phase: 0.5 },   // theta-colored
  { color: "#10B981", baseRadius: 76,  speed: 0.019, phase: 1.1 },   // alpha-colored
  { color: "#F59E0B", baseRadius: 46,  speed: 0.027, phase: 1.7 },   // beta-colored
  { color: "#EF4444", baseRadius: 20,  speed: 0.035, phase: 2.3 },   // innermost — fixed small
] as const;

export function FractalFeedback({ alpha, theta, beta, score }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const offsetRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;   // 600
    const H = canvas.height;  // 400
    const cx = W / 2;
    const cy = H / 2;

    // Normalize band values (assumed 0–1 range; clamp defensively)
    const aNorm = Math.max(0, Math.min(1, alpha ?? 0.5));
    const tNorm = Math.max(0, Math.min(1, theta ?? 0.5));
    const bNorm = Math.max(0, Math.min(1, beta ?? 0.5));
    const sNorm = Math.max(0, Math.min(100, score ?? 50)) / 100;

    // Overall amplitude scalar driven by score
    const amplitudeScale = 0.4 + sNorm * 0.6;  // 0.4 (low) → 1.0 (high)

    // Per-ring amplitude modifiers from EEG bands
    //   Ring 0 (outermost): score-based only
    //   Ring 1: theta
    //   Ring 2: alpha
    //   Ring 3: beta
    //   Ring 4: fixed small
    const bandAmplitudes = [
      amplitudeScale,                              // ring 0 — score only
      0.4 + tNorm * 0.6,                          // ring 1 — theta
      0.4 + aNorm * 0.6,                          // ring 2 — alpha
      0.4 + bNorm * 0.6,                          // ring 3 — beta
      0.5,                                         // ring 4 — fixed
    ];

    function draw() {
      // Persistence trail — semi-transparent fill instead of clearing fully
      ctx!.fillStyle = "rgba(10,10,26,0.15)";
      ctx!.fillRect(0, 0, W, H);

      offsetRef.current += 0.01;
      const offset = offsetRef.current;

      for (let ri = 0; ri < RINGS.length; ri++) {
        const ring = RINGS[ri];
        const ampMod = bandAmplitudes[ri];
        const r = ring.baseRadius * amplitudeScale;  // base radius scaled by score
        const amplitude = ampMod;                    // vertical stretch factor
        const phase = ring.phase;
        const rotationOffset = offset * ring.speed * (1 / 0.007); // normalize to consistent speed unit

        ctx!.beginPath();
        for (let i = 0; i <= 180; i++) {
          const t = (i / 180) * Math.PI * 2;
          const x = cx + r * Math.cos(t + rotationOffset);
          const y = cy + r * Math.sin(t + phase) * amplitude;
          if (i === 0) {
            ctx!.moveTo(x, y);
          } else {
            ctx!.lineTo(x, y);
          }
        }
        ctx!.closePath();

        // Opacity slightly higher for inner rings to keep center vivid
        const ringOpacity = 0.55 + (RINGS.length - 1 - ri) * 0.04;
        ctx!.strokeStyle = ring.color + Math.round(ringOpacity * 255).toString(16).padStart(2, "0");
        ctx!.lineWidth = ri === 0 ? 1.2 : 1.5 - ri * 0.1;
        ctx!.stroke();
      }

      // Score text overlay in center
      if (score !== null) {
        const fontSize = Math.round(22 + sNorm * 14);
        ctx!.font = `bold ${fontSize}px 'Inter', system-ui, sans-serif`;
        ctx!.textAlign = "center";
        ctx!.textBaseline = "middle";
        ctx!.fillStyle = "rgba(255,255,255,0.88)";
        ctx!.fillText(String(Math.round(score)), cx, cy);
      }

      frameRef.current = requestAnimationFrame(draw);
    }

    // Initial hard clear before first frame
    ctx.fillStyle = "#0a0a1a";
    ctx.fillRect(0, 0, W, H);

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameRef.current);
    };
  }, [alpha, theta, beta, score]);

  return (
    <div style={{ width: "100%" }}>
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        style={{
          width: "100%",
          display: "block",
          borderRadius: "12px",
          background: "#0a0a1a",
        }}
      />
    </div>
  );
}
