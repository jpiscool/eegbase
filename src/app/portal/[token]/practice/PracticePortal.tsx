"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { savePracticeResult } from "./actions";

// ─── Practice definitions ────────────────────────────────────────────────────

type PracticeId = "breath" | "alpha" | "focus";

type Practice = {
  id: PracticeId;
  title: string;
  subtitle: string;
  durationSeconds: number;
  icon: string;
  description: string;
  instructions: string[];
};

const PRACTICES: Practice[] = [
  {
    id: "breath",
    title: "Breath Awareness",
    subtitle: "5 min · 4-7-8 breathing",
    durationSeconds: 300,
    icon: "🫁",
    description: "A guided 4-7-8 breathing exercise to activate your parasympathetic nervous system and reduce anxiety.",
    instructions: [
      "Find a comfortable seated position",
      "Follow the animated circle — inhale as it expands, hold at peak, exhale as it contracts",
      "Keep your eyes lightly closed or softly focused",
      "Try to complete at least 3 full cycles",
    ],
  },
  {
    id: "alpha",
    title: "Alpha Relaxation",
    subtitle: "10 min · Eyes-closed relaxation",
    durationSeconds: 600,
    icon: "🧘",
    description: "A deep relaxation session designed to encourage alpha brainwave states, associated with calm alertness and reduced anxiety.",
    instructions: [
      "Sit or lie down in a quiet environment",
      "Close your eyes or use a sleep mask",
      "Follow the on-screen prompts between glances",
      "Allow thoughts to pass without engagement",
    ],
  },
  {
    id: "focus",
    title: "Focus Training",
    subtitle: "8 min · Attention tracking",
    durationSeconds: 480,
    icon: "🎯",
    description: "Track a moving dot with your eyes and tap when it enters the target zone. Trains sustained attention and response inhibition.",
    instructions: [
      "Keep your head still and track the dot with your eyes only",
      "Tap or click when the dot enters the highlighted ring",
      "Do not anticipate — respond only when the dot is in the zone",
      "Accuracy matters more than speed",
    ],
  },
];

// ─── Phase types ─────────────────────────────────────────────────────────────

type Phase = "select" | "prepare" | "active" | "complete";

// ─── Breath animation component ───────────────────────────────────────────────

function BreathCircle({ elapsed }: { elapsed: number }) {
  // 4-7-8 cycle = 19 seconds total
  const CYCLE = 19;
  const cyclePos = elapsed % CYCLE;

  let phase: "inhale" | "hold" | "exhale";
  let phaseProgress: number;
  let phaseLabel: string;

  if (cyclePos < 4) {
    phase = "inhale";
    phaseProgress = cyclePos / 4;
    phaseLabel = "Inhale";
  } else if (cyclePos < 11) {
    phase = "hold";
    phaseProgress = (cyclePos - 4) / 7;
    phaseLabel = "Hold";
  } else {
    phase = "exhale";
    phaseProgress = (cyclePos - 11) / 8;
    phaseLabel = "Exhale";
  }

  const size = phase === "inhale" ? 80 + phaseProgress * 80 : phase === "hold" ? 160 : 160 - phaseProgress * 80;
  const opacity = phase === "hold" ? 1 : phase === "inhale" ? 0.6 + phaseProgress * 0.4 : 1 - phaseProgress * 0.3;
  const cycleCount = Math.floor(elapsed / CYCLE) + 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: "radial-gradient(circle at 40% 35%, #60A5FA, #2563EB)",
          opacity,
          transition: `width ${phase === "inhale" ? 4 : phase === "hold" ? 0 : 8}s linear, height ${phase === "inhale" ? 4 : phase === "hold" ? 0 : 8}s linear, opacity 0.5s`,
          boxShadow: `0 0 ${size * 0.6}px rgba(37,99,235,0.25)`,
        }}
      />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#1E3A8A", letterSpacing: "-0.02em" }}>
          {phaseLabel}
        </div>
        <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>
          Cycle {cycleCount}
        </div>
      </div>
    </div>
  );
}

// ─── Alpha relaxation component ───────────────────────────────────────────────

const ALPHA_PROMPTS = [
  "Notice the weight of your body... let it sink...",
  "With each breath out, release a little more tension...",
  "Your mind is clear and quiet, like still water...",
  "Notice any sounds around you — let them pass through...",
  "Feel the rhythm of your breathing, slow and easy...",
  "There is nothing to do right now, nowhere to be...",
  "Allow your thoughts to drift like clouds...",
  "Notice the space between your thoughts...",
  "Your nervous system is resting, restoring...",
  "Stay here a little longer... you are doing well...",
];

function AlphaRelaxation({ elapsed, totalSeconds }: { elapsed: number; totalSeconds: number }) {
  const promptIndex = Math.floor(elapsed / 30) % ALPHA_PROMPTS.length;
  const hue = (elapsed * 0.5) % 360;
  const hue2 = (hue + 40) % 360;

  return (
    <div
      style={{
        width: "100%",
        borderRadius: 20,
        overflow: "hidden",
        position: "relative",
        minHeight: 280,
        background: `linear-gradient(135deg, hsl(${hue},60%,88%) 0%, hsl(${hue2},50%,92%) 100%)`,
        transition: "background 8s linear",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        padding: "40px 24px",
      }}
    >
      <div
        style={{
          fontSize: 16,
          fontWeight: 500,
          color: "#1E293B",
          textAlign: "center",
          lineHeight: 1.6,
          maxWidth: 320,
          opacity: 0.85,
          letterSpacing: "0.01em",
        }}
      >
        {ALPHA_PROMPTS[promptIndex]}
      </div>
      <div
        style={{
          width: "60%",
          height: 4,
          borderRadius: 99,
          background: "rgba(30,41,59,0.15)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${(elapsed / totalSeconds) * 100}%`,
            borderRadius: 99,
            background: "rgba(30,41,59,0.4)",
            transition: "width 1s linear",
          }}
        />
      </div>
      <div style={{ fontSize: 12, color: "#475569", opacity: 0.6 }}>
        Eyes closed · breathe naturally
      </div>
    </div>
  );
}

// ─── Focus training component ─────────────────────────────────────────────────

function FocusTrainer({
  elapsed,
  onHit,
  onMiss,
  hits,
  misses,
}: {
  elapsed: number;
  onHit: () => void;
  onMiss: () => void;
  hits: number;
  misses: number;
}) {
  const canvasSize = 300;
  const t = elapsed * 0.4; // figure-8 speed
  // Lissajous figure-8: x = sin(t), y = sin(2t)
  const rawX = Math.sin(t);
  const rawY = Math.sin(2 * t) * 0.5;
  const dotX = canvasSize / 2 + rawX * (canvasSize * 0.35);
  const dotY = canvasSize / 2 + rawY * (canvasSize * 0.35);

  // Target zone: bottom-right quadrant ish
  const targetX = canvasSize * 0.72;
  const targetY = canvasSize * 0.65;
  const targetR = 40;

  const dist = Math.hypot(dotX - targetX, dotY - targetY);
  const inZone = dist < targetR;

  const accuracy = hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <div
        style={{ position: "relative", width: canvasSize, height: canvasSize, borderRadius: 16, background: "#F8FAFC", border: "1px solid #E2E8F0", overflow: "hidden", cursor: "crosshair" }}
        onClick={() => {
          if (inZone) onHit();
          else onMiss();
        }}
      >
        {/* Target zone ring */}
        <div
          style={{
            position: "absolute",
            left: targetX - targetR,
            top: targetY - targetR,
            width: targetR * 2,
            height: targetR * 2,
            borderRadius: "50%",
            border: `2px solid ${inZone ? "#16A34A" : "#CBD5E1"}`,
            background: inZone ? "rgba(22,163,74,0.08)" : "transparent",
            transition: "border-color 0.1s, background 0.1s",
          }}
        />
        {/* Moving dot */}
        <div
          style={{
            position: "absolute",
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: inZone ? "#16A34A" : "#2563EB",
            boxShadow: inZone ? "0 0 12px rgba(22,163,74,0.5)" : "0 0 8px rgba(37,99,235,0.3)",
            left: dotX - 9,
            top: dotY - 9,
            transition: "background 0.1s, box-shadow 0.1s",
          }}
        />
      </div>
      <div style={{ display: "flex", gap: 24, fontSize: 13, color: "#475569" }}>
        <span>Hits: <strong style={{ color: "#16A34A" }}>{hits}</strong></span>
        <span>Misses: <strong style={{ color: "#DC2626" }}>{misses}</strong></span>
        {accuracy !== null && <span>Accuracy: <strong>{accuracy}%</strong></span>}
      </div>
      <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>
        Tap/click when the dot is inside the ring
      </p>
    </div>
  );
}

// ─── Star rating component ────────────────────────────────────────────────────

function StarRating({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", gap: 6 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            style={{
              fontSize: 24,
              background: "none",
              border: "none",
              cursor: "pointer",
              opacity: n <= value ? 1 : 0.25,
              transition: "opacity 0.1s",
              padding: "2px 4px",
            }}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main portal component ────────────────────────────────────────────────────

export function PracticePortal({
  token,
  clientName,
}: {
  token: string;
  clientName: string;
}) {
  const [phase, setPhase] = useState<Phase>("select");
  const [practice, setPractice] = useState<Practice | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [ratings, setRatings] = useState({ mood: 0, energy: 0, focus: 0 });
  const [completionNotes, setCompletionNotes] = useState("");
  const [saveResult, setSaveResult] = useState<{ success: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
  }, [stopTimer]);

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  // Auto-complete when time runs out
  useEffect(() => {
    if (phase === "active" && practice && elapsed >= practice.durationSeconds) {
      stopTimer();
      setPhase("complete");
    }
  }, [elapsed, phase, practice, stopTimer]);

  function handleSelectPractice(p: Practice) {
    setPractice(p);
    setPhase("prepare");
    setElapsed(0);
    setHits(0);
    setMisses(0);
  }

  function handleStart() {
    setPhase("active");
    startTimer();
  }

  function handleEndEarly() {
    stopTimer();
    setPhase("complete");
  }

  function handleSave() {
    if (!practice) return;
    startTransition(async () => {
      const res = await savePracticeResult(token, practice.id, elapsed, ratings, completionNotes);
      setSaveResult(res);
    });
  }

  function formatTime(s: number): string {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  }

  // ── Phase: Select ────────────────────────────────────────────────────────────

  if (phase === "select") {
    return (
      <div style={S.page}>
        <style>{KEYFRAMES}</style>
        <div style={S.container}>
          <div style={{ marginBottom: 32 }}>
            <div style={S.brand}>EEG<span style={{ color: "#2563EB" }}>Base</span></div>
            <h1 style={S.heading}>Home Practice</h1>
            <p style={S.subtext}>
              Hi <strong>{clientName}</strong> — choose a practice session below.
            </p>
            <p style={{ ...S.subtext, fontSize: 12, marginTop: 4 }}>
              No EEG device required for home practice.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {PRACTICES.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectPractice(p)}
                style={S.practiceCard}
              >
                <div style={{ fontSize: 36, marginBottom: 8 }}>{p.icon}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", marginBottom: 2 }}>
                  {p.title}
                </div>
                <div style={{ fontSize: 12, color: "#2563EB", fontWeight: 600, marginBottom: 8 }}>
                  {p.subtitle}
                </div>
                <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.5 }}>
                  {p.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Phase: Prepare ───────────────────────────────────────────────────────────

  if (phase === "prepare" && practice) {
    return (
      <div style={S.page}>
        <style>{KEYFRAMES}</style>
        <div style={S.container}>
          <button onClick={() => setPhase("select")} style={S.backBtn}>
            ← Back
          </button>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{practice.icon}</div>
            <h1 style={S.heading}>{practice.title}</h1>
            <p style={{ ...S.subtext, color: "#2563EB", fontWeight: 600 }}>{practice.subtitle}</p>
          </div>

          <div style={S.card}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#475569" }}>No device needed</span>
              <span style={{ fontSize: 11, background: "#F0FDF4", color: "#16A34A", fontWeight: 700, padding: "2px 8px", borderRadius: 99, border: "1px solid #BBF7D0" }}>HOME PRACTICE</span>
            </div>
            <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, marginBottom: 16 }}>
              {practice.description}
            </p>
            <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 10 }}>
                Instructions
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column" as const, gap: 8 }}>
                {practice.instructions.map((inst, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "#475569" }}>
                    <span style={{ minWidth: 20, height: 20, borderRadius: "50%", background: "#EFF6FF", color: "#2563EB", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {i + 1}
                    </span>
                    {inst}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <button onClick={handleStart} style={{ ...S.btnPrimary, width: "100%", marginTop: 20 }}>
            Begin Practice
          </button>
        </div>
      </div>
    );
  }

  // ── Phase: Active ────────────────────────────────────────────────────────────

  if (phase === "active" && practice) {
    const remaining = practice.durationSeconds - elapsed;
    const progress = elapsed / practice.durationSeconds;

    return (
      <div style={S.page}>
        <style>{KEYFRAMES}</style>
        <div style={S.container}>
          {/* Header bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
                {practice.icon} {practice.title}
              </div>
              <div style={{ fontSize: 12, color: "#94A3B8" }}>
                {formatTime(remaining)} remaining
              </div>
            </div>
            <button onClick={handleEndEarly} style={S.btnSecondary}>
              End Early
            </button>
          </div>

          {/* Progress bar */}
          <div style={{ width: "100%", height: 4, borderRadius: 99, background: "#F1F5F9", marginBottom: 28, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress * 100}%`, borderRadius: 99, background: "#2563EB", transition: "width 1s linear" }} />
          </div>

          {/* Practice-specific UI */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            {practice.id === "breath" && (
              <BreathCircle elapsed={elapsed} />
            )}
            {practice.id === "alpha" && (
              <AlphaRelaxation elapsed={elapsed} totalSeconds={practice.durationSeconds} />
            )}
            {practice.id === "focus" && (
              <FocusTrainer
                elapsed={elapsed}
                onHit={() => setHits((h) => h + 1)}
                onMiss={() => setMisses((m) => m + 1)}
                hits={hits}
                misses={misses}
              />
            )}
          </div>

          {/* Timer display */}
          <div style={{ textAlign: "center", marginTop: 28, fontSize: 13, color: "#94A3B8" }}>
            {formatTime(elapsed)} elapsed · {formatTime(remaining)} remaining
          </div>
        </div>
      </div>
    );
  }

  // ── Phase: Complete ──────────────────────────────────────────────────────────

  if (phase === "complete" && practice) {
    if (saveResult?.success) {
      return (
        <div style={S.page}>
          <style>{KEYFRAMES}</style>
          <div style={S.container}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
              <h1 style={S.heading}>Results Saved!</h1>
              <p style={S.subtext}>Great work, {clientName}. Your clinician can see your practice history.</p>
              <button
                onClick={() => {
                  setPhase("select");
                  setPractice(null);
                  setElapsed(0);
                  setRatings({ mood: 0, energy: 0, focus: 0 });
                  setCompletionNotes("");
                  setSaveResult(null);
                }}
                style={{ ...S.btnPrimary, marginTop: 24 }}
              >
                Practice Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={S.page}>
        <style>{KEYFRAMES}</style>
        <div style={S.container}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>
              {elapsed >= practice.durationSeconds ? "✅" : "⏹️"}
            </div>
            <h1 style={S.heading}>Practice Complete!</h1>
            <p style={S.subtext}>
              {practice.title} · {formatTime(elapsed)} completed
            </p>
            {practice.id === "focus" && hits + misses > 0 && (
              <div style={{ marginTop: 12, fontSize: 14, color: "#475569" }}>
                Hits: <strong style={{ color: "#16A34A" }}>{hits}</strong> ·
                Misses: <strong style={{ color: "#DC2626" }}>{misses}</strong> ·
                Accuracy: <strong>{Math.round((hits / (hits + misses)) * 100)}%</strong>
              </div>
            )}
          </div>

          <div style={S.card}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>
              How do you feel?
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
              <StarRating
                label="Mood"
                value={ratings.mood}
                onChange={(v) => setRatings((r) => ({ ...r, mood: v }))}
              />
              <StarRating
                label="Energy"
                value={ratings.energy}
                onChange={(v) => setRatings((r) => ({ ...r, energy: v }))}
              />
              <StarRating
                label="Focus"
                value={ratings.focus}
                onChange={(v) => setRatings((r) => ({ ...r, focus: v }))}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Notes <span style={{ fontWeight: 400, color: "#94A3B8" }}>(optional)</span>
              </label>
              <textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="How did it go? Any observations to share with your clinician..."
                rows={3}
                style={S.textarea}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button
              onClick={() => {
                setPhase("select");
                setPractice(null);
                setElapsed(0);
                setRatings({ mood: 0, energy: 0, focus: 0 });
                setCompletionNotes("");
              }}
              style={{ ...S.btnSecondary, flex: 1 }}
            >
              Skip &amp; Return
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              style={{ ...S.btnPrimary, flex: 2, opacity: isPending ? 0.6 : 1 }}
            >
              {isPending ? "Saving..." : "Save & Return"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Styles & keyframes ───────────────────────────────────────────────────────

const KEYFRAMES = `
  @keyframes pulseRing {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.08); opacity: 0.85; }
  }
`;

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#F8FAFC",
    padding: "32px 16px 64px",
  },
  container: {
    maxWidth: 480,
    margin: "0 auto",
  },
  brand: {
    fontSize: 14,
    fontWeight: 800,
    letterSpacing: "-0.02em",
    color: "#0F172A",
    marginBottom: 6,
  },
  heading: {
    fontSize: 22,
    fontWeight: 700,
    color: "#0F172A",
    margin: "0 0 6px",
  },
  subtext: {
    fontSize: 14,
    color: "#64748B",
    margin: 0,
  },
  practiceCard: {
    width: "100%",
    background: "white",
    border: "1px solid #E2E8F0",
    borderRadius: 16,
    padding: "20px 20px",
    textAlign: "left" as const,
    cursor: "pointer",
    transition: "box-shadow 0.15s, border-color 0.15s",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  },
  card: {
    background: "white",
    borderRadius: 16,
    padding: "24px 20px",
    boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
    border: "1px solid #F1F5F9",
  },
  btnPrimary: {
    padding: "12px 24px",
    background: "#2563EB",
    color: "white",
    border: "none",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity 0.15s",
  },
  btnSecondary: {
    padding: "10px 18px",
    background: "#F1F5F9",
    color: "#334155",
    border: "1px solid #E2E8F0",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "#64748B",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    padding: "0 0 20px",
    display: "block",
  },
  textarea: {
    width: "100%",
    padding: "9px 12px",
    border: "1px solid #E2E8F0",
    borderRadius: 10,
    fontSize: 14,
    color: "#0F172A",
    resize: "vertical" as const,
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
  },
};
