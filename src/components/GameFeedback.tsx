"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  score: number | null;
  threshold: number;
}

interface Star {
  id: number;
  angle: number;
  startRadius: number;
  speed: number;
  size: number;
  hue: number;
}

function zoneLabel(score: number, threshold: number): string {
  if (score < threshold - 15) return "Drifting · keep focus";
  if (score < threshold) return "Warming up";
  if (score < threshold + 10) return "On target  ✦";
  if (score < threshold + 25) return "Cruising  ✦✦";
  return "Hyperdrive  ✦✦✦";
}

function zoneColor(score: number, threshold: number): string {
  if (score < threshold - 15) return "#64748B";
  if (score < threshold) return "#F59E0B";
  if (score < threshold + 10) return "#10B981";
  if (score < threshold + 25) return "#06B6D4";
  return "#A855F7";
}

function altitudeFromScore(score: number): number {
  // 0 → 100 km, 100 → 100,000 km
  return Math.round(100 + Math.pow(score / 100, 1.5) * 99900);
}

function altitudeLayer(km: number): string {
  if (km < 500) return "Low orbit";
  if (km < 5000) return "Mid orbit";
  if (km < 20000) return "High orbit";
  if (km < 50000) return "Lunar transfer";
  return "Deep space";
}

export function GameFeedback({ score, threshold }: Props) {
  const s = score ?? 0;
  const color = zoneColor(s, threshold);
  const zone = score == null ? "Awaiting signal…" : zoneLabel(s, threshold);
  const speedFactor = Math.max(0.15, s / 100); // 0.15 → 1.0
  const altitude = score == null ? 0 : altitudeFromScore(s);
  const layer = altitudeLayer(altitude);
  const isPeak = s >= threshold + 10;
  const isHyper = s >= threshold + 25;

  // Generate star field once
  const starsRef = useRef<Star[]>([]);
  if (starsRef.current.length === 0) {
    starsRef.current = Array.from({ length: 70 }, (_, i) => ({
      id: i,
      angle: (i * 137.5) % 360, // golden angle for even distribution
      startRadius: 30 + Math.random() * 40,
      speed: 0.6 + Math.random() * 0.8,
      size: 0.5 + Math.random() * 1.8,
      hue: 200 + Math.random() * 120,
    }));
  }

  // Animation tick to drive the warp effect
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let raf: number;
    let last = performance.now();
    const step = (now: number) => {
      const dt = now - last;
      if (dt > 33) {
        // ~30fps
        setTick((t) => t + 1);
        last = now;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Compute current star positions based on speedFactor + tick
  const t = tick * 0.05;
  const stars = starsRef.current.map((star) => {
    const phase = (t * star.speed * speedFactor + star.id * 0.31) % 1;
    const radius = star.startRadius + phase * 220;
    const opacity = Math.min(1, phase * 2.2);
    const angleRad = (star.angle * Math.PI) / 180;
    const cx = 200 + Math.cos(angleRad) * radius;
    const cy = 200 + Math.sin(angleRad) * radius;
    // Streak length based on speed
    const trailLen = 8 + speedFactor * 26;
    const tailX = cx - Math.cos(angleRad) * trailLen;
    const tailY = cy - Math.sin(angleRad) * trailLen;
    return { ...star, cx, cy, tailX, tailY, opacity };
  });

  const score4 = (s).toFixed(0);

  return (
    <div
      style={{
        width: "100%",
        background: "linear-gradient(180deg, #0B1220 0%, #060A14 100%)",
        borderRadius: 12,
        position: "relative",
        overflow: "hidden",
        border: "1px solid #1E293B",
      }}
      aria-label={`Cosmic flight neurofeedback game · score ${score4}`}
    >
      <style>{`
        @keyframes shipBob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        @keyframes engineFlare { 0%, 100% { opacity: 0.6; transform: scaleY(1); } 50% { opacity: 1; transform: scaleY(1.3); } }
        @keyframes hyperPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.85; } }
        @keyframes nebulaDrift { 0% { transform: translate(0, 0) rotate(0deg); } 100% { transform: translate(-10px, 6px) rotate(3deg); } }
        @keyframes badgePop { 0% { opacity: 0; transform: translateY(6px); } 100% { opacity: 1; transform: translateY(0); } }
      `}</style>

      <svg viewBox="0 0 400 400" width="100%" style={{ display: "block" }}>
        <defs>
          {/* Vignette */}
          <radialGradient id="vignette" cx="50%" cy="50%" r="55%">
            <stop offset="60%" stopColor="transparent" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0.85" />
          </radialGradient>

          {/* Nebula clouds */}
          <radialGradient id="nebula1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity={isPeak ? "0.35" : "0.18"} />
            <stop offset="60%" stopColor={color} stopOpacity="0.05" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="nebula2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7C3AED" stopOpacity={isHyper ? "0.4" : "0.12"} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          {/* Ship body gradient */}
          <linearGradient id="shipBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F1F5F9" />
            <stop offset="50%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>

          {/* Engine flame */}
          <linearGradient id="flame" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="40%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="cosmicGlow">
            <feGaussianBlur stdDeviation="3" />
          </filter>
          <filter id="strongGlow">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* Background stars (static, far away) */}
        {Array.from({ length: 30 }).map((_, i) => {
          const angle = (i * 73) % 360;
          const r = 60 + ((i * 17) % 130);
          const x = 200 + Math.cos((angle * Math.PI) / 180) * r;
          const y = 200 + Math.sin((angle * Math.PI) / 180) * r;
          return (
            <circle key={`bg-${i}`} cx={x} cy={y} r={0.6 + (i % 3) * 0.2} fill="white" opacity={0.3 + (i % 5) * 0.1} />
          );
        })}

        {/* Drifting nebula clouds */}
        <ellipse
          cx="120" cy="100" rx="120" ry="80"
          fill="url(#nebula1)"
          style={{ animation: "nebulaDrift 12s ease-in-out infinite alternate" }}
        />
        <ellipse
          cx="290" cy="280" rx="100" ry="70"
          fill="url(#nebula2)"
          style={{ animation: "nebulaDrift 16s ease-in-out infinite alternate-reverse" }}
        />

        {/* Warp star streaks */}
        {stars.map((star) => (
          <line
            key={`star-${star.id}-${tick % 2}`}
            x1={star.tailX}
            y1={star.tailY}
            x2={star.cx}
            y2={star.cy}
            stroke={`hsl(${star.hue}, 90%, 75%)`}
            strokeWidth={star.size}
            strokeLinecap="round"
            opacity={star.opacity * 0.9}
          />
        ))}

        {/* Vignette overlay */}
        <rect width="400" height="400" fill="url(#vignette)" pointerEvents="none" />

        {/* Hyperdrive ring (only when in hyper zone) */}
        {isHyper && (
          <circle
            cx="200" cy="200" r="80"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeDasharray="3 9"
            opacity="0.5"
            style={{ animation: "hyperPulse 0.8s ease-in-out infinite" }}
          />
        )}

        {/* Ship glow halo */}
        <circle
          cx="200" cy="210"
          r={20 + speedFactor * 12}
          fill={color}
          opacity={isPeak ? 0.45 : 0.25}
          filter="url(#strongGlow)"
        />

        {/* Engine flame trail */}
        <g style={{ animation: "engineFlare 0.4s ease-in-out infinite" }}>
          <ellipse
            cx="200"
            cy={232 + speedFactor * 8}
            rx={6 + speedFactor * 4}
            ry={14 + speedFactor * 22}
            fill="url(#flame)"
            filter="url(#cosmicGlow)"
          />
          {isPeak && (
            <ellipse
              cx="200"
              cy={224 + speedFactor * 8}
              rx={3 + speedFactor * 2}
              ry={10 + speedFactor * 12}
              fill="white"
              opacity="0.85"
            />
          )}
        </g>

        {/* Spaceship */}
        <g style={{ animation: "shipBob 3.2s ease-in-out infinite", transformOrigin: "200px 210px" }}>
          {/* Wings */}
          <path d="M 200 210 L 178 234 L 188 226 Z" fill="#1E293B" stroke="#475569" strokeWidth="1" />
          <path d="M 200 210 L 222 234 L 212 226 Z" fill="#1E293B" stroke="#475569" strokeWidth="1" />
          {/* Body */}
          <path
            d="M 200 178
               L 188 210
               L 188 224
               Q 200 232, 212 224
               L 212 210 Z"
            fill="url(#shipBody)"
            stroke="#0F172A"
            strokeWidth="1.5"
          />
          {/* Cockpit window */}
          <ellipse cx="200" cy="200" rx="6" ry="9" fill={color} opacity="0.85" />
          <ellipse cx="200" cy="197" rx="3" ry="4" fill="white" opacity="0.6" />
          {/* Tip highlight */}
          <path d="M 200 178 L 197 196 L 203 196 Z" fill="white" opacity="0.4" />
        </g>

        {/* Score display (top-left HUD) */}
        <g>
          <rect x="14" y="14" width="86" height="42" rx="8" fill="#0F172A" opacity="0.75" stroke="#334155" strokeWidth="1" />
          <text x="22" y="28" fontSize="9" fontWeight="700" fill="#94A3B8" letterSpacing="0.1em">SCORE</text>
          <text x="22" y="50" fontSize="22" fontWeight="800" fill="white" style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em" }}>
            {score == null ? "—" : score4}
          </text>
        </g>

        {/* Altitude display (top-right HUD) */}
        <g>
          <rect x="290" y="14" width="96" height="42" rx="8" fill="#0F172A" opacity="0.75" stroke="#334155" strokeWidth="1" />
          <text x="298" y="28" fontSize="9" fontWeight="700" fill="#94A3B8" letterSpacing="0.1em">ALTITUDE</text>
          <text x="298" y="50" fontSize="16" fontWeight="800" fill="white" style={{ fontVariantNumeric: "tabular-nums" }}>
            {altitude.toLocaleString()} km
          </text>
        </g>

        {/* Threshold marker on left edge */}
        <g>
          <line x1="20" y1={380 - (threshold / 100) * 320} x2="40" y2={380 - (threshold / 100) * 320} stroke="#14B8A6" strokeWidth="1.5" strokeDasharray="3 3" />
          <text x="44" y={384 - (threshold / 100) * 320} fontSize="9" fill="#14B8A6" fontWeight="700">TARGET ▲ {threshold}</text>
        </g>

        {/* Score thermometer on left edge */}
        <rect x="20" y={380 - (s / 100) * 320} width="6" height={(s / 100) * 320} fill={color} rx="3" opacity="0.85" />
        <rect x="20" y="60" width="6" height="320" fill="#1E293B" rx="3" opacity="0.6" pointerEvents="none" />

        {/* Zone label (bottom center) */}
        <g style={{ animation: "badgePop 0.4s ease-out" }} key={zone}>
          <rect x="100" y="354" width="200" height="32" rx="16" fill="#0F172A" opacity="0.85" stroke={color} strokeWidth="1.5" />
          <text x="200" y="374" textAnchor="middle" fontSize="13" fontWeight="800" fill={color} letterSpacing="0.02em">
            {zone}
          </text>
        </g>

        {/* Layer label (between altitude HUD and ship) */}
        <text x="338" y="74" textAnchor="middle" fontSize="10" fontWeight="700" fill="#64748B" letterSpacing="0.08em">
          {layer.toUpperCase()}
        </text>
      </svg>
    </div>
  );
}
