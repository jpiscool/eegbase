"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  score: number | null;
  threshold: number;
}

interface Orb {
  id: number;
  x: number;
  y: number;
  collected: boolean;
  bornAt: number;
  hue: number;
}

interface Achievement {
  id: number;
  text: string;
  bornAt: number;
}

function zoneLabel(score: number, threshold: number): string {
  if (score < threshold - 15) return "Drifting · soften your focus";
  if (score < threshold) return "Settling in";
  if (score < threshold + 10) return "In the zone";
  if (score < threshold + 25) return "Deep flow";
  return "Peak coherence";
}

function zoneTint(score: number, threshold: number): { primary: string; secondary: string } {
  if (score < threshold - 15) return { primary: "#475569", secondary: "#1E293B" };
  if (score < threshold) return { primary: "#7C3AED", secondary: "#312E81" };
  if (score < threshold + 10) return { primary: "#06B6D4", secondary: "#164E63" };
  if (score < threshold + 25) return { primary: "#10B981", secondary: "#064E3B" };
  return { primary: "#F59E0B", secondary: "#78350F" };
}

export function GameFeedback({ score, threshold }: Props) {
  // Manual override mode lets viewer play with the demo
  const [manualMode, setManualMode] = useState(false);
  const [manualScore, setManualScore] = useState(50);
  const [orbs, setOrbs] = useState<Orb[]>([]);
  const [collected, setCollected] = useState(0);
  const [streak, setStreak] = useState(0); // consecutive ticks in zone
  const [bestStreak, setBestStreak] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [draggingThreshold, setDraggingThreshold] = useState(false);
  const [localThreshold, setLocalThreshold] = useState(threshold);
  const svgRef = useRef<SVGSVGElement>(null);

  // Effective score: manual override or live brain score
  const effectiveScore = manualMode ? manualScore : (score ?? 0);
  const effectiveThreshold = localThreshold;
  const tint = zoneTint(effectiveScore, effectiveThreshold);
  const intensity = Math.max(0.15, effectiveScore / 100);
  const zone = score == null && !manualMode ? "Awaiting signal…" : zoneLabel(effectiveScore, effectiveThreshold);
  const isPeak = effectiveScore >= effectiveThreshold + 10;
  const isFlow = effectiveScore >= effectiveThreshold + 25;
  const inTargetZone = effectiveScore >= effectiveThreshold;

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

  // Streak tracking — reward consecutive time in target zone
  useEffect(() => {
    if (inTargetZone) {
      setStreak((s) => {
        const next = s + 1;
        setBestStreak((b) => Math.max(b, next));
        // Trigger achievements at streak milestones
        if (next === 30) addAchievement("✦ 1 second in zone");
        if (next === 90) addAchievement("✦✦ 3 seconds in zone");
        if (next === 300) addAchievement("✦✦✦ 10 seconds in flow!");
        return next;
      });
    } else {
      setStreak(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, inTargetZone]);

  // Spawn collectible orbs randomly
  useEffect(() => {
    if (tick % 60 === 0 && orbs.filter((o) => !o.collected).length < 3) {
      setOrbs((prev) => [
        ...prev.slice(-15),
        {
          id: Date.now() + Math.random(),
          x: 60 + Math.random() * 280,
          y: 100 + Math.random() * 160,
          collected: false,
          bornAt: tick,
          hue: 200 + Math.random() * 120,
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  // Auto-collect orbs when figure passes through them
  useEffect(() => {
    const figureY = 360 - (effectiveScore / 100) * 240; // figure altitude
    const figureX = 200;
    setOrbs((prev) =>
      prev.map((orb) => {
        if (orb.collected) return orb;
        const dx = orb.x - figureX;
        const dy = orb.y - figureY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 30) {
          setCollected((c) => c + 1);
          if (collected > 0 && (collected + 1) % 5 === 0) {
            addAchievement(`◇ ${collected + 1} orbs collected`);
          }
          return { ...orb, collected: true };
        }
        return orb;
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, effectiveScore]);

  function addAchievement(text: string) {
    const a = { id: Date.now() + Math.random(), text, bornAt: performance.now() };
    setAchievements((prev) => [...prev.slice(-2), a]);
    setTimeout(() => setAchievements((prev) => prev.filter((x) => x.id !== a.id)), 2500);
  }

  // SVG mouse handlers
  function svgPoint(e: React.MouseEvent<SVGSVGElement>): { x: number; y: number } {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const x = ((e.clientX - rect.left) / rect.width) * 400;
    const y = ((e.clientY - rect.top) / rect.height) * 400;
    return { x, y };
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const p = svgPoint(e);
    setHoverPos(p);
    if (draggingThreshold) {
      // Drag the threshold line
      const newThreshold = Math.round(Math.max(20, Math.min(95, ((360 - p.y) / 240) * 100)));
      setLocalThreshold(newThreshold);
    } else if (manualMode && e.buttons === 1) {
      // Drag to adjust manual score
      const newScore = Math.round(Math.max(0, Math.min(100, ((360 - p.y) / 240) * 100)));
      setManualScore(newScore);
    }
  }

  function handleMouseLeave() {
    setHoverPos(null);
    setDraggingThreshold(false);
  }

  function handleMouseDown(e: React.MouseEvent<SVGSVGElement>) {
    const p = svgPoint(e);
    const thresholdY = 360 - (effectiveThreshold / 100) * 240;
    if (Math.abs(p.y - thresholdY) < 12) {
      setDraggingThreshold(true);
    } else if (manualMode) {
      const newScore = Math.round(Math.max(0, Math.min(100, ((360 - p.y) / 240) * 100)));
      setManualScore(newScore);
    }
  }

  function handleMouseUp() {
    setDraggingThreshold(false);
  }

  // Generate stars once
  const starsRef = useRef<{ x: number; y: number; size: number; offset: number }[]>([]);
  if (starsRef.current.length === 0) {
    starsRef.current = Array.from({ length: 50 }, () => ({
      x: Math.random() * 400,
      y: Math.random() * 220,
      size: 0.3 + Math.random() * 1.2,
      offset: Math.random() * Math.PI * 2,
    }));
  }

  const t = tick * 0.04;
  const figureY = 360 - (effectiveScore / 100) * 240;
  const figureX = 200;
  const thresholdY = 360 - (effectiveThreshold / 100) * 240;

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
    >
      <style>{`
        @keyframes auroraShimmer { 0%, 100% { opacity: 0.85; } 50% { opacity: 1; } }
        @keyframes orbCollected { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(2.2); opacity: 0; } }
        @keyframes achBadge { 0% { opacity: 0; transform: translate(-50%, 12px) scale(0.92); } 30% { opacity: 1; transform: translate(-50%, 0) scale(1); } 80% { opacity: 1; } 100% { opacity: 0; transform: translate(-50%, -12px) scale(1.04); } }
        @keyframes figureBob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
      `}</style>

      {/* Manual mode toggle (overlay button) */}
      <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 5, display: "flex", gap: 6 }}>
        <button
          onClick={() => setManualMode(false)}
          style={{
            fontSize: 11, fontWeight: 600, padding: "6px 12px", borderRadius: 999,
            background: !manualMode ? tint.primary : "rgba(2,6,23,0.7)",
            color: !manualMode ? "white" : "#94A3B8",
            border: !manualMode ? `1px solid ${tint.primary}` : "1px solid #334155",
            cursor: "pointer", letterSpacing: "0.02em",
            transition: "all 0.15s",
          }}
        >
          ● Live brain
        </button>
        <button
          onClick={() => setManualMode(true)}
          style={{
            fontSize: 11, fontWeight: 600, padding: "6px 12px", borderRadius: 999,
            background: manualMode ? tint.primary : "rgba(2,6,23,0.7)",
            color: manualMode ? "white" : "#94A3B8",
            border: manualMode ? `1px solid ${tint.primary}` : "1px solid #334155",
            cursor: "pointer", letterSpacing: "0.02em",
            transition: "all 0.15s",
          }}
        >
          ✋ Try it yourself
        </button>
      </div>

      <svg
        ref={svgRef}
        viewBox="0 0 400 400"
        width="100%"
        style={{ display: "block", cursor: draggingThreshold ? "ns-resize" : manualMode ? "ns-resize" : "crosshair" }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={tint.secondary} />
            <stop offset="50%" stopColor="#020617" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          <linearGradient id="auroraGrad1" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={tint.primary} stopOpacity="0" />
            <stop offset="40%" stopColor={tint.primary} stopOpacity="0.7" />
            <stop offset="60%" stopColor={tint.primary} stopOpacity="0.7" />
            <stop offset="100%" stopColor={tint.primary} stopOpacity="0" />
          </linearGradient>

          <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={tint.secondary} stopOpacity="0.3" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>

          <radialGradient id="figureGrad">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="40%" stopColor={tint.primary} stopOpacity="0.95" />
            <stop offset="100%" stopColor={tint.primary} stopOpacity="0" />
          </radialGradient>

          <linearGradient id="mountainGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>

          <filter id="orbGlow"><feGaussianBlur stdDeviation="2" /></filter>
          <filter id="strongGlow"><feGaussianBlur stdDeviation="5" /></filter>
        </defs>

        {/* Sky */}
        <rect width="400" height="280" fill="url(#skyGrad)" />

        {/* Stars */}
        {starsRef.current.map((star, i) => {
          const twinkle = 0.4 + 0.6 * (Math.sin(t + star.offset) * 0.5 + 0.5);
          return (
            <circle
              key={i}
              cx={star.x}
              cy={star.y}
              r={star.size}
              fill="white"
              opacity={twinkle * (0.3 + intensity * 0.6)}
            />
          );
        })}

        {/* Aurora ribbons */}
        {[
          { yBase: 90, amp: 16, phase: 0 },
          { yBase: 110, amp: 20, phase: 1.4 },
          { yBase: 140, amp: 14, phase: 2.8 },
        ].map((ribbon, ri) => {
          const points: string[] = [];
          for (let i = 0; i <= 40; i++) {
            const x = (i / 40) * 400;
            const wave = Math.sin(x * 0.018 + t * 0.6 + ribbon.phase) * ribbon.amp;
            points.push(`${x},${ribbon.yBase + wave}`);
          }
          for (let i = 40; i >= 0; i--) {
            const x = (i / 40) * 400;
            const wave = Math.sin(x * 0.018 + t * 0.6 + ribbon.phase) * ribbon.amp;
            points.push(`${x},${ribbon.yBase + wave + 26 + intensity * 14}`);
          }
          return (
            <polygon
              key={ri}
              points={points.join(" ")}
              fill="url(#auroraGrad1)"
              opacity={0.4 + intensity * 0.5}
              filter="url(#strongGlow)"
              style={{ animation: "auroraShimmer 4s ease-in-out infinite" }}
            />
          );
        })}

        {/* Mountain silhouette */}
        <path
          d="M 0 280 L 30 250 L 60 240 L 95 220 L 130 245 L 165 215 L 200 232 L 240 200 L 275 222 L 315 205 L 355 235 L 400 218 L 400 280 Z"
          fill="url(#mountainGrad)"
        />

        {/* Water */}
        <rect x="0" y="280" width="400" height="120" fill="url(#waterGrad)" />

        {/* Threshold line — draggable */}
        <g style={{ cursor: "ns-resize" }}>
          <line
            x1="0" y1={thresholdY} x2="400" y2={thresholdY}
            stroke={tint.primary}
            strokeWidth={draggingThreshold ? 2 : 1}
            strokeDasharray="4 6"
            opacity={draggingThreshold ? 0.95 : 0.55}
          />
          <rect x="0" y={thresholdY - 8} width="400" height="16" fill="transparent" style={{ cursor: "ns-resize" }} />
          <g transform={`translate(380, ${thresholdY})`}>
            <rect x="-2" y="-10" width="14" height="20" rx="3" fill={tint.primary} opacity="0.85" />
            <text x="5" y="4" textAnchor="middle" fontSize="10" fontWeight="700" fill="white">⇅</text>
          </g>
          <text x="8" y={thresholdY - 4} fontSize="9" fontWeight="700" fill={tint.primary} letterSpacing="0.06em">TARGET {effectiveThreshold}</text>
        </g>

        {/* Collectible orbs */}
        {orbs.map((orb) => (
          <g key={orb.id}>
            {orb.collected ? (
              <circle
                cx={orb.x} cy={orb.y} r="6"
                fill={`hsl(${orb.hue}, 90%, 65%)`}
                opacity="0.7"
                filter="url(#orbGlow)"
                style={{ animation: "orbCollected 0.5s ease-out forwards" }}
              />
            ) : (
              <>
                <circle
                  cx={orb.x} cy={orb.y} r="9"
                  fill="none"
                  stroke={`hsl(${orb.hue}, 90%, 65%)`}
                  strokeWidth="0.8"
                  opacity={0.45 + Math.sin(t * 2 + orb.id) * 0.2}
                />
                <circle
                  cx={orb.x} cy={orb.y} r="4"
                  fill={`hsl(${orb.hue}, 90%, 70%)`}
                  filter="url(#orbGlow)"
                />
              </>
            )}
          </g>
        ))}

        {/* Hover trail particle */}
        {hoverPos && (
          <circle
            cx={hoverPos.x}
            cy={hoverPos.y}
            r="14"
            fill={tint.primary}
            opacity="0.18"
            filter="url(#strongGlow)"
            pointerEvents="none"
          />
        )}

        {/* Figure (the "you" in the journey) */}
        <g style={{ animation: "figureBob 2.5s ease-in-out infinite" }}>
          {/* Glow halo */}
          <circle cx={figureX} cy={figureY} r={18 + intensity * 8} fill="url(#figureGrad)" opacity={0.6 + intensity * 0.4} />
          {/* Solid core */}
          <circle cx={figureX} cy={figureY} r="6" fill="white" />
          <circle cx={figureX} cy={figureY} r="9" fill="none" stroke={tint.primary} strokeWidth="1.5" opacity="0.9" />
          {/* Trail */}
          {!isFlow && (
            <line x1={figureX} y1={figureY + 4} x2={figureX} y2={figureY + 14} stroke={tint.primary} strokeWidth="1" opacity="0.4" />
          )}
        </g>

        {/* Score HUD top-left */}
        <g pointerEvents="none">
          <rect x="14" y="14" width="80" height="40" rx="10" fill="rgba(2,6,23,0.7)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <text x="22" y="28" fontSize="9" fontWeight="700" fill="#94A3B8" letterSpacing="0.12em">SCORE</text>
          <text x="22" y="48" fontSize="20" fontWeight="800" fill="white" style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em" }}>
            {score == null && !manualMode ? "—" : effectiveScore.toFixed(0)}
          </text>
        </g>

        {/* Streak/Orbs HUD top-right */}
        <g pointerEvents="none">
          <rect x="306" y="14" width="80" height="40" rx="10" fill="rgba(2,6,23,0.7)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <text x="314" y="28" fontSize="9" fontWeight="700" fill="#94A3B8" letterSpacing="0.12em">ORBS</text>
          <text x="314" y="48" fontSize="20" fontWeight="800" fill={tint.primary} style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em" }}>
            ◇ {collected}
          </text>
        </g>

        {/* Streak strip bottom */}
        <g pointerEvents="none">
          <rect x="14" y="362" width="80" height="28" rx="14" fill="rgba(2,6,23,0.7)" stroke={inTargetZone ? tint.primary : "rgba(255,255,255,0.06)"} strokeWidth="1" />
          <text x="54" y="380" textAnchor="middle" fontSize="11" fontWeight="700" fill={inTargetZone ? tint.primary : "#64748B"}>
            ⏱ {(streak / 30).toFixed(1)}s
          </text>
        </g>

        {/* Best streak */}
        <g pointerEvents="none">
          <rect x="306" y="362" width="80" height="28" rx="14" fill="rgba(2,6,23,0.7)" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <text x="346" y="380" textAnchor="middle" fontSize="11" fontWeight="700" fill="#94A3B8">
            best {(bestStreak / 30).toFixed(1)}s
          </text>
        </g>

        {/* Zone label center bottom */}
        <g style={{ animation: "achBadge 0.4s ease-out" }} key={zone} pointerEvents="none">
          <rect x="110" y="362" width="180" height="28" rx="14" fill="rgba(2,6,23,0.85)" stroke={tint.primary} strokeWidth="1" />
          <text x="200" y="380" textAnchor="middle" fontSize="12" fontWeight="700" fill={tint.primary} letterSpacing="0.02em">
            {zone}
          </text>
        </g>

        {/* Achievement banners */}
        {achievements.map((a, i) => (
          <g key={a.id} pointerEvents="none">
            <rect
              x="125" y={210 - i * 36} width="150" height="32" rx="16"
              fill="rgba(2,6,23,0.92)" stroke={tint.primary} strokeWidth="1.5"
              style={{ animation: "achBadge 2.5s ease-out forwards" }}
            />
            <text
              x="200" y={230 - i * 36} textAnchor="middle"
              fontSize="12" fontWeight="700" fill={tint.primary}
              style={{ animation: "achBadge 2.5s ease-out forwards" }}
            >
              {a.text}
            </text>
          </g>
        ))}

        {/* Manual mode hint */}
        {manualMode && (
          <text x="200" y="65" textAnchor="middle" fontSize="11" fontWeight="600" fill="#94A3B8" pointerEvents="none">
            ↕ Click and drag anywhere to adjust simulated brain score
          </text>
        )}
      </svg>

      {/* Footer info strip — always visible explanation */}
      <div style={{ background: "#0F172A", borderTop: "1px solid #1E293B", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: "#94A3B8", flexWrap: "wrap", gap: 8 }}>
        <span>
          <strong style={{ color: "#F1F5F9", fontWeight: 600 }}>Drag the dashed line</strong> to adjust target threshold · <strong style={{ color: "#F1F5F9", fontWeight: 600 }}>collect orbs</strong> by sustaining target zone
        </span>
        <span style={{ color: "#64748B" }}>
          Streak best: <strong style={{ color: tint.primary, fontWeight: 700 }}>{(bestStreak / 30).toFixed(1)}s</strong>
        </span>
      </div>
    </div>
  );
}
