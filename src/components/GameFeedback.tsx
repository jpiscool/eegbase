"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  score: number | null;
  threshold: number;
}

interface Particle {
  id: number;
  x: number;
  baseY: number;
  speed: number;
  size: number;
  hue: number;
  twinkleOffset: number;
}

function zoneLabel(score: number, threshold: number): string {
  if (score < threshold - 15) return "Drifting · soften your focus";
  if (score < threshold) return "Settling in";
  if (score < threshold + 10) return "In the zone";
  if (score < threshold + 25) return "Deep flow";
  return "Peak coherence";
}

function zoneTint(score: number, threshold: number): { primary: string; secondary: string } {
  if (score < threshold - 15) return { primary: "#475569", secondary: "#1E293B" };  // grey
  if (score < threshold) return { primary: "#7C3AED", secondary: "#312E81" };       // purple
  if (score < threshold + 10) return { primary: "#06B6D4", secondary: "#164E63" };  // teal
  if (score < threshold + 25) return { primary: "#10B981", secondary: "#064E3B" };  // emerald
  return { primary: "#F59E0B", secondary: "#78350F" };                              // amber
}

export function GameFeedback({ score, threshold }: Props) {
  const s = score ?? 0;
  const tint = zoneTint(s, threshold);
  const intensity = Math.max(0.15, s / 100);
  const zone = score == null ? "Awaiting signal…" : zoneLabel(s, threshold);
  const isPeak = s >= threshold + 10;
  const isFlow = s >= threshold + 25;

  // Generate stars once
  const starsRef = useRef<Particle[]>([]);
  if (starsRef.current.length === 0) {
    starsRef.current = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 400,
      baseY: 20 + Math.random() * 200,
      speed: 0.3 + Math.random() * 0.7,
      size: 0.4 + Math.random() * 1.4,
      hue: 200 + Math.random() * 60,
      twinkleOffset: Math.random() * Math.PI * 2,
    }));
  }

  // Animation tick
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let raf: number;
    let last = performance.now();
    const step = (now: number) => {
      const dt = now - last;
      if (dt > 33) {
        setTick((t) => t + 1);
        last = now;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  const t = tick * 0.04;

  // Aurora ribbon paths — each computed with sine wave drift
  const auroraRibbons = [
    { yBase: 80, amp: 18, phase: 0, opacity: 0.6 + intensity * 0.4 },
    { yBase: 100, amp: 22, phase: 1.4, opacity: 0.45 + intensity * 0.5 },
    { yBase: 130, amp: 16, phase: 2.8, opacity: 0.35 + intensity * 0.55 },
  ];

  // Twinkling stars
  const starOpacities = starsRef.current.map((star) => {
    const twinkle = 0.4 + 0.6 * (Math.sin(t * star.speed + star.twinkleOffset) * 0.5 + 0.5);
    return twinkle * (0.3 + intensity * 0.7);
  });

  // Floating particles for peak / flow state
  const ascendParticles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: 40 + (i * 30 + (tick * 0.6) % 40) % 320,
    y: 280 - ((tick * (1 + i * 0.15)) % 200),
    size: 1.2 + (i % 3) * 0.8,
  }));

  return (
    <div
      style={{
        width: "100%",
        background: "#020617",
        borderRadius: 18,
        position: "relative",
        overflow: "hidden",
        border: "1px solid #1E293B",
        boxShadow: "0 1px 0 0 rgba(255,255,255,0.05) inset, 0 12px 36px -16px rgba(0,0,0,0.6)",
      }}
      aria-label={`Aurora neurofeedback game · score ${s.toFixed(0)}`}
    >
      <style>{`
        @keyframes auroraShimmer { 0%, 100% { opacity: 0.85; } 50% { opacity: 1; } }
        @keyframes badgeFade { 0% { opacity: 0; transform: translateY(8px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes mountainGlow { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.6; } }
      `}</style>

      <svg viewBox="0 0 400 400" width="100%" style={{ display: "block" }}>
        <defs>
          {/* Sky gradient — shifts with score */}
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={tint.secondary} />
            <stop offset="50%" stopColor="#020617" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          {/* Aurora gradient — color flows from primary to transparent */}
          <linearGradient id="auroraGrad1" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={tint.primary} stopOpacity="0" />
            <stop offset="40%" stopColor={tint.primary} stopOpacity="0.7" />
            <stop offset="60%" stopColor={tint.primary} stopOpacity="0.7" />
            <stop offset="100%" stopColor={tint.primary} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="auroraGrad2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#A855F7" stopOpacity="0" />
            <stop offset="50%" stopColor="#A855F7" stopOpacity={isFlow ? "0.5" : "0.25"} />
            <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
          </linearGradient>

          {/* Reflection gradient on water */}
          <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={tint.secondary} stopOpacity="0.3" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>

          {/* Star glow filter */}
          <filter id="starGlow">
            <feGaussianBlur stdDeviation="0.8" />
          </filter>
          <filter id="auroraGlow">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <filter id="strongGlow">
            <feGaussianBlur stdDeviation="3" />
          </filter>

          {/* Mountain silhouette */}
          <linearGradient id="mountainGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
        </defs>

        {/* Sky background */}
        <rect width="400" height="280" fill="url(#skyGrad)" />

        {/* Distant stars */}
        {starsRef.current.slice(0, 40).map((star, i) => {
          const opacity = starOpacities[i] ?? 0.3;
          if (star.baseY > 220) return null;
          return (
            <circle
              key={star.id}
              cx={star.x}
              cy={star.baseY}
              r={star.size}
              fill="white"
              opacity={opacity}
              filter="url(#starGlow)"
            />
          );
        })}

        {/* Aurora ribbons — flowing horizontal curves */}
        <g style={{ animation: "auroraShimmer 4s ease-in-out infinite" }}>
          {auroraRibbons.map((ribbon, ri) => {
            const points: string[] = [];
            const samples = 40;
            for (let i = 0; i <= samples; i++) {
              const x = (i / samples) * 400;
              // Each ribbon has slightly different wave function
              const wave = Math.sin(x * 0.018 + t * 0.6 + ribbon.phase) * ribbon.amp +
                           Math.sin(x * 0.04 + t * 0.4 + ri) * (ribbon.amp * 0.4);
              const y = ribbon.yBase + wave;
              points.push(`${x},${y}`);
            }
            // Bottom edge of ribbon (wider for soft fade)
            for (let i = samples; i >= 0; i--) {
              const x = (i / samples) * 400;
              const wave = Math.sin(x * 0.018 + t * 0.6 + ribbon.phase) * ribbon.amp +
                           Math.sin(x * 0.04 + t * 0.4 + ri) * (ribbon.amp * 0.4);
              const y = ribbon.yBase + wave + 28 + intensity * 16;
              points.push(`${x},${y}`);
            }
            return (
              <polygon
                key={ri}
                points={points.join(" ")}
                fill={ri === 1 ? "url(#auroraGrad2)" : "url(#auroraGrad1)"}
                opacity={ribbon.opacity}
                filter="url(#auroraGlow)"
              />
            );
          })}
        </g>

        {/* Sharper aurora line on top of ribbon */}
        {isPeak && (
          <g>
            {auroraRibbons.slice(0, 2).map((ribbon, ri) => {
              const points: string[] = [];
              const samples = 40;
              for (let i = 0; i <= samples; i++) {
                const x = (i / samples) * 400;
                const wave = Math.sin(x * 0.018 + t * 0.6 + ribbon.phase) * ribbon.amp +
                             Math.sin(x * 0.04 + t * 0.4 + ri) * (ribbon.amp * 0.4);
                const y = ribbon.yBase + wave;
                points.push(`${x},${y}`);
              }
              return (
                <polyline
                  key={`line-${ri}`}
                  points={points.join(" ")}
                  fill="none"
                  stroke={tint.primary}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity={0.9}
                />
              );
            })}
          </g>
        )}

        {/* Floating particles (only in flow state) */}
        {isFlow && ascendParticles.map((p) => (
          <circle
            key={p.id}
            cx={p.x}
            cy={p.y}
            r={p.size}
            fill={tint.primary}
            opacity={Math.max(0.2, 1 - (280 - p.y) / 200)}
            filter="url(#starGlow)"
          />
        ))}

        {/* Mountain silhouette */}
        <path
          d="M 0 280
             L 30 250
             L 60 240
             L 95 220
             L 130 245
             L 165 215
             L 200 232
             L 240 200
             L 275 222
             L 315 205
             L 355 235
             L 400 218
             L 400 280 Z"
          fill="url(#mountainGrad)"
        />

        {/* Mountain peak glow when peaking */}
        {isPeak && (
          <path
            d="M 200 232
               L 240 200
               L 275 222"
            fill="none"
            stroke={tint.primary}
            strokeWidth="0.5"
            opacity="0.6"
            filter="url(#strongGlow)"
            style={{ animation: "mountainGlow 3s ease-in-out infinite" }}
          />
        )}

        {/* Water reflection — mirror of sky */}
        <rect x="0" y="280" width="400" height="120" fill="url(#waterGrad)" />

        {/* Water reflection of aurora (subtle, blurred) */}
        <g opacity="0.35" transform="translate(0, 560) scale(1, -1)">
          {auroraRibbons.map((ribbon, ri) => {
            const points: string[] = [];
            const samples = 20;
            for (let i = 0; i <= samples; i++) {
              const x = (i / samples) * 400;
              const wave = Math.sin(x * 0.018 + t * 0.6 + ribbon.phase) * ribbon.amp;
              const y = ribbon.yBase + wave;
              points.push(`${x},${y}`);
            }
            for (let i = samples; i >= 0; i--) {
              const x = (i / samples) * 400;
              const wave = Math.sin(x * 0.018 + t * 0.6 + ribbon.phase) * ribbon.amp;
              const y = ribbon.yBase + wave + 20;
              points.push(`${x},${y}`);
            }
            return (
              <polygon
                key={`refl-${ri}`}
                points={points.join(" ")}
                fill={ri === 1 ? "url(#auroraGrad2)" : "url(#auroraGrad1)"}
                opacity="0.5"
                filter="url(#auroraGlow)"
              />
            );
          })}
        </g>

        {/* Subtle ripple lines on water */}
        {[300, 320, 340, 360].map((y, i) => (
          <line
            key={`ripple-${y}`}
            x1={20 + Math.sin(t * 0.5 + i) * 8}
            y1={y}
            x2={380 + Math.sin(t * 0.5 + i + 0.5) * 8}
            y2={y}
            stroke={tint.primary}
            strokeWidth="0.3"
            opacity={0.15 + intensity * 0.2}
          />
        ))}

        {/* HUD: Score in top-left corner */}
        <g>
          <rect x="14" y="14" width="80" height="40" rx="10" fill="rgba(2,6,23,0.6)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <text x="22" y="28" fontSize="9" fontWeight="700" fill="#94A3B8" letterSpacing="0.12em">SCORE</text>
          <text x="22" y="48" fontSize="20" fontWeight="800" fill="white" style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em" }}>
            {score == null ? "—" : s.toFixed(0)}
          </text>
        </g>

        {/* HUD: Threshold marker top-right */}
        <g>
          <rect x="306" y="14" width="80" height="40" rx="10" fill="rgba(2,6,23,0.6)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <text x="314" y="28" fontSize="9" fontWeight="700" fill="#94A3B8" letterSpacing="0.12em">TARGET</text>
          <text x="314" y="48" fontSize="20" fontWeight="800" fill={tint.primary} style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em" }}>
            ▲ {threshold}
          </text>
        </g>

        {/* Score thermometer on left edge */}
        <rect x="20" y="70" width="4" height="200" fill="rgba(255,255,255,0.06)" rx="2" />
        <rect
          x="20"
          y={270 - (s / 100) * 200}
          width="4"
          height={(s / 100) * 200}
          fill={tint.primary}
          rx="2"
          opacity="0.85"
          filter="url(#strongGlow)"
        />
        <line x1="14" y1={270 - (threshold / 100) * 200} x2="30" y2={270 - (threshold / 100) * 200} stroke={tint.primary} strokeWidth="1" strokeDasharray="2 2" />

        {/* Zone label — bottom center */}
        <g style={{ animation: "badgeFade 0.4s ease-out" }} key={zone}>
          <rect x="100" y="362" width="200" height="28" rx="14" fill="rgba(2,6,23,0.7)" stroke={tint.primary} strokeWidth="1" />
          <text x="200" y="380" textAnchor="middle" fontSize="12" fontWeight="700" fill={tint.primary} letterSpacing="0.02em">
            {zone}
          </text>
        </g>
      </svg>
    </div>
  );
}
