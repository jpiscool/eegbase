"use client";

import { useEffect, useRef, useState } from "react";

/**
 * FocusGame — "Anchor" — hardware-free analog of a Mendi fNIRS session.
 *
 * Why this design (informed by the literature):
 *  • Mendi's actual game is "watch a ball rise with sustained calm focus."
 *    The user is doing focused-attention meditation, not reaction-time. So
 *    this trainer rewards SUSTAINED quiet engagement, never speed.
 *  • Real prefrontal HbO2 elevation in fNIRS papers comes from three
 *    behavioural correlates that we mirror as three scored streams:
 *      1. Autonomic regulation     — paced breath at ~5.5 BPM resonance
 *      2. Motor stillness          — anchor object held without drift
 *      3. Inhibitory control       — don't react to occasional distractors
 *  • Score is a 6-second EMA — biological pacing, not arcade. HeartMath
 *    uses 64 s windows updated every 5 s; we land in the same family.
 *  • Visual: a single soft anchor orb pulses with the breath. Score drives
 *    halo brightness and particle alignment. No red, no failure states —
 *    lower scores just look quieter, matching Muse / Mendi conventions.
 *
 * Inputs (any of these, all the time):
 *  • Touch    — finger held on the orb (stillness measured by displacement)
 *  • Mouse    — click-and-hold (cursor stillness measured)
 *  • SPACE    — bar held; stillness component is reduced weight
 *
 * The 0..100 output drives the same `gameRewardVal` that feeds Aurora,
 * Generative Art and Audio Interrupt panels.
 */

type Props = {
  /** Called on each animation frame with a 0..100 reward signal. */
  onScore: (score: number) => void;
  /** When false, the loop stops and the consumer score is zeroed. */
  active: boolean;
  /** Container height in px. */
  height?: number;
  /** Resonance frequency. 5.5 BPM = 10.91 s cycle (Lehrer/Vaschillo). */
  bpm?: number;
};

// Pleasant calibration period before scoring starts so the user finds the rhythm
const CALIBRATION_MS = 5_000;
// Distractor dot cadence
const DISTRACTOR_MIN_GAP_MS = 12_000;
const DISTRACTOR_MAX_GAP_MS = 18_000;
const DISTRACTOR_VISIBLE_MS = 1_100;
// Score weights
const W_PHASE = 0.40;
const W_STILL = 0.35;
const W_INHIB = 0.25;
// EMA: alpha=0.04 at ~60Hz ≈ 6 s time constant
const EMA_ALPHA = 0.04;
// Stillness scale — pixels of pointer drift per second that maps to 1/e accuracy
const STILLNESS_SIGMA_PX = 22;

type Distractor = {
  id: number;
  startedAt: number;     // performance.now()
  fromEdge: 0 | 1 | 2 | 3; // 0=top 1=right 2=bottom 3=left
  reactedAt: number | null; // when user released or jiggled during it
};

export function FocusGame({ onScore, active, height = 320, bpm = 5.5 }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // ── Refs (physics, not rendering) ───────────────────────────────────────
  const startedAtRef = useRef(0);
  const heldRef = useRef(false);
  const lastPointerRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const driftPxPerSecRef = useRef(0);
  // For SPACE-bar players we lower the stillness weight (they have no proxy).
  const inputModeRef = useRef<"pointer" | "keyboard" | null>(null);
  // Score components
  const phaseScoreRef = useRef(0);
  const stillnessRef = useRef(0);
  const inhibitionRef = useRef(0.5);   // starts neutral so calibration isn't dark
  const smoothedRef = useRef(0);
  // Distractors
  const distractorRef = useRef<Distractor | null>(null);
  const nextDistractorAtRef = useRef(0);
  const lastDistractorIdRef = useRef(0);

  // ── State (mirror for JSX) ──────────────────────────────────────────────
  const [phase, setPhase] = useState(0);          // 0..1 of breath cycle
  const [held, setHeld] = useState(false);
  const [smoothed, setSmoothed] = useState(0);    // 0..1 score
  const [calibrating, setCalibrating] = useState(true);
  type DistractorView = { fromEdge: 0 | 1 | 2 | 3; progress: number; pulse: number };
  const [distractorView, setDistractorView] = useState<DistractorView | null>(null);
  const [meters, setMeters] = useState({ breath: 0, still: 0, inhib: 0.5 });
  const [hasInteracted, setHasInteracted] = useState(false);

  const cycleSeconds = 60 / bpm;

  // ── Animation loop ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!active) {
      smoothedRef.current = 0;
      heldRef.current = false;
      onScore(0);
      return;
    }
    // Reset run state — inputModeRef is cleared so each new run requires the
    // user to actively engage before any score accrues.
    startedAtRef.current = performance.now();
    phaseScoreRef.current = 0;
    stillnessRef.current = 0;
    inhibitionRef.current = 0;
    smoothedRef.current = 0;
    distractorRef.current = null;
    inputModeRef.current = null;
    driftPxPerSecRef.current = 0;
    nextDistractorAtRef.current = performance.now() + DISTRACTOR_MIN_GAP_MS + Math.random() * (DISTRACTOR_MAX_GAP_MS - DISTRACTOR_MIN_GAP_MS);

    let raf = 0;
    let lastT = performance.now();
    const tick = () => {
      const now = performance.now();
      const dtMs = now - lastT;
      lastT = now;
      const elapsedMs = now - startedAtRef.current;
      const inCalibration = elapsedMs < CALIBRATION_MS;

      // ── Breath phase ───────────────────────────────────────────────────
      const ph = ((elapsedMs / 1000) / cycleSeconds) % 1;
      const expectedHold = ph < 0.5;          // inhale half = hold
      const actualHold = heldRef.current;

      // ── Engagement gate ────────────────────────────────────────────────
      // The user is "engaged" only after they've started interacting at least
      // once (touched the orb, clicked, or pressed SPACE). Without engagement
      // every stream returns 0 — sitting still no longer scores 87.
      const engaged = inputModeRef.current !== null;

      // Phase coherence: 1 if held-state matches expected breath phase. Both
      // "always held" and "never held" average 0.5 by symmetry; only matching
      // the rhythm gets you to 1.
      const phaseInst = engaged && expectedHold === actualHold ? 1 : 0;
      phaseScoreRef.current = phaseScoreRef.current * 0.9 + phaseInst * 0.1;

      // ── Stillness ──────────────────────────────────────────────────────
      // driftPxPerSec is updated by pointermove handler. Decay it gently here
      // so the score recovers when the user stops moving.
      driftPxPerSecRef.current *= Math.exp(-dtMs / 600);
      let stillnessInst = 0;
      if (engaged) {
        stillnessInst = inputModeRef.current === "keyboard"
          ? 1 // keyboard players have no displacement proxy → full credit
          : Math.exp(-driftPxPerSecRef.current / STILLNESS_SIGMA_PX);
      }
      stillnessRef.current = stillnessRef.current * 0.85 + stillnessInst * 0.15;

      // ── Distractors / inhibitory control ───────────────────────────────
      // Spawn
      if (!distractorRef.current && now >= nextDistractorAtRef.current && !inCalibration) {
        const id = ++lastDistractorIdRef.current;
        const fromEdge = (Math.floor(Math.random() * 4) as 0 | 1 | 2 | 3);
        distractorRef.current = { id, startedAt: now, fromEdge, reactedAt: null };
      }
      // Detect reaction (release or rapid drift) while distractor visible
      let distractorViewNow: DistractorView | null = null;
      if (distractorRef.current) {
        const visibleFor = now - distractorRef.current.startedAt;
        if (visibleFor < DISTRACTOR_VISIBLE_MS) {
          if (distractorRef.current.reactedAt == null) {
            // Reaction = a *motor* response. We don't penalise SPACE/pointer
            // releases that are simply tracking the breath rhythm — phase
            // coherence already scores those. Pointer jiggle, or for keyboard
            // a release while distractor is visible, counts as a reaction.
            const reacted = inputModeRef.current === "keyboard"
              ? !heldRef.current
              : driftPxPerSecRef.current > STILLNESS_SIGMA_PX * 1.6;
            if (reacted) {
              distractorRef.current.reactedAt = now;
              inhibitionRef.current = Math.max(0, inhibitionRef.current - 0.25);
            }
          }
          const progress = visibleFor / DISTRACTOR_VISIBLE_MS;
          distractorViewNow = { fromEdge: distractorRef.current.fromEdge, progress, pulse: Math.sin(progress * Math.PI) };
        } else {
          // Clean-ignore reward only counts when the user is actually
          // engaged. Otherwise sitting still reads as a "win".
          if (distractorRef.current.reactedAt == null && inputModeRef.current !== null) {
            inhibitionRef.current = Math.min(1, inhibitionRef.current + 0.15);
          }
          distractorRef.current = null;
          nextDistractorAtRef.current = now + DISTRACTOR_MIN_GAP_MS + Math.random() * (DISTRACTOR_MAX_GAP_MS - DISTRACTOR_MIN_GAP_MS);
        }
      }
      setDistractorView(distractorViewNow);

      // ── Combined score ─────────────────────────────────────────────────
      const raw = inCalibration
        ? 0
        : W_PHASE * phaseScoreRef.current
          + W_STILL * stillnessRef.current
          + W_INHIB * inhibitionRef.current;
      smoothedRef.current = smoothedRef.current * (1 - EMA_ALPHA) + raw * EMA_ALPHA;
      onScore(Math.max(0, Math.min(100, smoothedRef.current * 100)));

      // Mirror to React state
      setPhase(ph);
      setHeld(actualHold);
      setSmoothed(smoothedRef.current);
      setMeters({
        breath: phaseScoreRef.current,
        still: stillnessRef.current,
        inhib: inhibitionRef.current,
      });
      if (inCalibration !== calibrating) setCalibrating(inCalibration);

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // calibrating in deps would loop; we sync via setCalibrating only on change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, cycleSeconds, onScore]);

  // ── SPACE bar input ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!active) return;
    const onDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        heldRef.current = true;
        if (inputModeRef.current == null) inputModeRef.current = "keyboard";
        setHasInteracted(true);
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        heldRef.current = false;
      }
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [active]);

  // ── Pointer handlers ────────────────────────────────────────────────────
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    heldRef.current = true;
    inputModeRef.current = "pointer";
    setHasInteracted(true);
    const rect = e.currentTarget.getBoundingClientRect();
    lastPointerRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top, t: performance.now() };
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!heldRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const now = performance.now();
    const last = lastPointerRef.current;
    if (last) {
      const dt = (now - last.t) / 1000;
      if (dt > 0) {
        const dx = x - last.x;
        const dy = y - last.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = dist / dt; // px/s
        // Blend new instantaneous speed into the drift accumulator
        driftPxPerSecRef.current = driftPxPerSecRef.current * 0.6 + speed * 0.4;
      }
    }
    lastPointerRef.current = { x, y, t: now };
  };
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    heldRef.current = false;
    lastPointerRef.current = null;
  };

  // ── Visual derivation ───────────────────────────────────────────────────
  const breathCurve = 0.5 - 0.5 * Math.cos(phase * Math.PI * 2); // 0..1
  const minR = 70;
  // Reserve ~36px below the orb for the breath phase label, ~36px above for
  // the score/pacer chips. Without this cap the phase label clipped at
  // height=320 (the default).
  const maxR = Math.min(120, height * 0.35);
  const orbRadius = minR + (maxR - minR) * breathCurve;
  const expectedHold = phase < 0.5;
  const inSync = expectedHold === held;

  // Anchor hue glides cool→warm as the score climbs (no red — never a fail signal)
  const hue = 200 - smoothed * 50;     // 200 (teal-blue) → 150 (mint-green)
  const sat = 60 + smoothed * 25;
  const lightness = 45 + smoothed * 15;
  const orbAlpha = 0.30 + smoothed * 0.55;
  const haloPx = 24 + smoothed * 90;

  const showCalibrationLabel = calibrating && active;

  // Distractor positioning (state-driven, no impure calls during render)
  let distractorStyle: React.CSSProperties | null = null;
  if (distractorView) {
    const travel = 40 + distractorView.progress * 80;
    let left = "50%", top = "50%";
    let translateX = "-50%", translateY = "-50%";
    if (distractorView.fromEdge === 0) { top = `${travel}px`; }
    else if (distractorView.fromEdge === 1) { left = `calc(100% - ${travel}px)`; translateX = "0"; }
    else if (distractorView.fromEdge === 2) { top = `calc(100% - ${travel}px)`; translateY = "0"; }
    else if (distractorView.fromEdge === 3) { left = `${travel}px`; translateX = "0"; }
    distractorStyle = {
      position: "absolute",
      left,
      top,
      width: 14,
      height: 14,
      marginLeft: -7,
      marginTop: -7,
      borderRadius: "50%",
      background: "rgba(244,114,182,0.85)",
      boxShadow: "0 0 12px rgba(244,114,182,0.6)",
      transform: `translate(${translateX}, ${translateY})`,
      opacity: 0.4 + 0.6 * distractorView.pulse,
      pointerEvents: "none",
      transition: "opacity 100ms linear",
    };
  }

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label="Anchor — paced breath, stillness, and inhibitory-control trainer"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position: "relative",
        height,
        width: "100%",
        borderRadius: 14,
        overflow: "hidden",
        background: "radial-gradient(ellipse at center, #0F2030 0%, #050912 70%, #020409 100%)",
        border: "1px solid #1E293B",
        cursor: active ? "pointer" : "default",
        touchAction: active ? "none" : "auto",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {/* Subtle grid */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(96,165,250,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.04) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          pointerEvents: "none",
        }}
      />

      {/* Outer phase guide ring at maxR */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: maxR * 2,
          height: maxR * 2,
          marginLeft: -maxR,
          marginTop: -maxR,
          borderRadius: "50%",
          border: "1.5px dashed rgba(148,163,184,0.22)",
          pointerEvents: "none",
        }}
      />

      {/* Anchor orb */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: orbRadius * 2,
          height: orbRadius * 2,
          marginLeft: -orbRadius,
          marginTop: -orbRadius,
          borderRadius: "50%",
          background: `radial-gradient(circle, hsla(${hue}, ${sat}%, ${lightness}%, ${orbAlpha}) 0%, hsla(${hue}, ${sat}%, ${lightness}%, ${Math.max(0, orbAlpha - 0.18)}) 55%, transparent 80%)`,
          boxShadow: `0 0 ${haloPx}px hsla(${hue}, ${sat}%, ${lightness}%, ${0.25 + smoothed * 0.55})`,
          transition: "background 260ms linear, box-shadow 260ms linear",
          pointerEvents: "none",
        }}
      />
      {/* Anchor core */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 16,
          height: 16,
          marginLeft: -8,
          marginTop: -8,
          borderRadius: "50%",
          background: `hsl(${hue}, ${sat + 10}%, ${lightness + 25}%)`,
          boxShadow: `0 0 14px hsla(${hue}, ${sat}%, ${lightness + 10}%, 0.9)`,
          pointerEvents: "none",
        }}
      />

      {/* Distractor */}
      {distractorStyle && <div aria-hidden style={distractorStyle} />}

      {/* Breath phase label below orb */}
      <div
        aria-live="polite"
        style={{
          position: "absolute",
          left: "50%",
          top: `calc(50% + ${maxR + 14}px)`,
          transform: "translateX(-50%)",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: inSync ? "#A7F3D0" : "#FCD34D",
          textShadow: "0 0 12px rgba(0,0,0,0.6)",
          pointerEvents: "none",
          whiteSpace: "nowrap",
          opacity: showCalibrationLabel ? 0.5 : 1,
        }}
      >
        {showCalibrationLabel ? "Calibrating · breathe with the orb" : (expectedHold ? "Inhale · hold" : "Exhale · release")}
      </div>

      {/* Score chip */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 12,
          background: "rgba(15,23,42,0.7)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 99,
          padding: "4px 10px",
          fontSize: 11,
          fontWeight: 700,
          color: "#A5B4FC",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          pointerEvents: "none",
        }}
      >
        Anchor · {Math.round(smoothed * 100)}
      </div>

      {/* Resonance pacer chip */}
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 12,
          background: "rgba(15,23,42,0.7)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 99,
          padding: "4px 10px",
          fontSize: 11,
          fontWeight: 700,
          color: "#94A3B8",
          letterSpacing: "0.06em",
          pointerEvents: "none",
        }}
      >
        {bpm.toFixed(1)} bpm · resonance
      </div>

      {/* Component meters — bottom row, only after calibration */}
      {!calibrating && active && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: 10,
            left: 12,
            right: 12,
            display: "flex",
            gap: 12,
            fontSize: 9,
            fontWeight: 700,
            color: "rgba(226,232,240,0.55)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            pointerEvents: "none",
          }}
        >
          <Meter label="Breath" value={meters.breath} />
          <Meter label="Still" value={meters.still} />
          <Meter label="Ignore" value={meters.inhib} />
        </div>
      )}

      {/* Onboarding hint — anchored at the top of the surface so it never
          fights with the phase label / sub-meters at the bottom. */}
      {!hasInteracted && active && (
        <div
          aria-live="polite"
          style={{
            position: "absolute",
            top: 46,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(15,23,42,0.78)",
            border: "1px solid rgba(165,180,252,0.4)",
            borderRadius: 99,
            padding: "6px 14px",
            fontSize: 12,
            fontWeight: 600,
            color: "#E2E8F0",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            maxWidth: "calc(100% - 32px)",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          Hold the orb, breathe with it, ignore the drift
        </div>
      )}

      {!active && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#475569",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          ▶ Press &ldquo;Begin Anchor&rdquo; to start
        </div>
      )}
    </div>
  );
}

// ── Component meter (sub-score visualisation) ──────────────────────────────
function Meter({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ minWidth: 36 }}>{label}</span>
      <div style={{ flex: 1, height: 3, borderRadius: 99, background: "rgba(148,163,184,0.18)", overflow: "hidden" }}>
        <div style={{ width: `${pct * 100}%`, height: "100%", background: "rgba(165,180,252,0.85)", transition: "width 220ms linear" }} />
      </div>
    </div>
  );
}
