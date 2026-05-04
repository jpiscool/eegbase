"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { saveCptResult } from "@/app/clients/[id]/cpt/actions";

const TOTAL_STIMULI = 180;
const TARGET_COUNT = 22;
const DURATION_SECONDS = 180;
const STIMULUS_DURATION_MS = 700;
const ISI_MS = 300;
const TARGET_LETTER = "X";

type TestPhase = "instructions" | "countdown" | "results";

// During the test itself we use a separate "running" state managed via refs
// to avoid stale-closure issues, but we expose it as a union here for clarity.
type Phase = TestPhase | "running";

interface Trial {
  stimulus: string;
  isTarget: boolean;
  responded: boolean;
  reactionTimeMs: number | null;
}

interface Props {
  clientId: string;
}

function generateStimuli(total: number, targetCount: number): string[] {
  const targets = Array(targetCount).fill(TARGET_LETTER);
  const distractors = Array.from({ length: total - targetCount }, () => {
    const letters = "ABCDEFGHJKLMNOPQRSTUVWYZ"; // no X
    return letters[Math.floor(Math.random() * letters.length)];
  });
  return [...targets, ...distractors].sort(() => Math.random() - 0.5);
}

export function CPTTest({ clientId }: Props) {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("instructions");
  const [countdown, setCountdown] = useState(3);
  const [currentLetter, setCurrentLetter] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(DURATION_SECONDS);
  const [trialIndex, setTrialIndex] = useState(0);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [saving, setSaving] = useState(false);

  const sequenceRef = useRef<string[]>([]);
  const trialsRef = useRef<Trial[]>([]);
  const stimulusStartRef = useRef<number>(0);
  const respondedThisTrialRef = useRef(false);
  const phaseRef = useRef<Phase>("instructions");

  // Keep phaseRef in sync so the keydown handler sees current phase
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const handleResponse = useCallback(() => {
    if (phaseRef.current !== "running") return;
    if (respondedThisTrialRef.current) return;
    respondedThisTrialRef.current = true;
    const rt = Date.now() - stimulusStartRef.current;
    const idx = trialsRef.current.length - 1;
    if (idx >= 0) {
      trialsRef.current[idx].responded = true;
      trialsRef.current[idx].reactionTimeMs =
        rt < STIMULUS_DURATION_MS ? rt : null;
    }
  }, []);

  // Space bar listener
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === "Space") {
        e.preventDefault();
        handleResponse();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleResponse]);

  function startCountdown() {
    setPhase("countdown");
    setCountdown(3);
  }

  // Countdown tick
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      beginTest();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, countdown]);

  function beginTest() {
    sequenceRef.current = generateStimuli(TOTAL_STIMULI, TARGET_COUNT);
    trialsRef.current = [];
    setTrialIndex(0);
    setTimeRemaining(DURATION_SECONDS);
    setPhase("running");
  }

  // Countdown timer (seconds remaining display)
  useEffect(() => {
    if (phase !== "running") return;
    const t = setInterval(() => {
      setTimeRemaining((s) => {
        if (s <= 1) {
          clearInterval(t);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  // Stimulus loop
  useEffect(() => {
    if (phase !== "running") return;
    const seq = sequenceRef.current;

    if (trialIndex >= seq.length) {
      // All stimuli exhausted — move to results
      const completed = [...trialsRef.current];
      setTrials(completed);
      setPhase("results");
      return;
    }

    const letter = seq[trialIndex];
    const isTarget = letter === TARGET_LETTER;

    setCurrentLetter(letter);
    stimulusStartRef.current = Date.now();
    respondedThisTrialRef.current = false;

    // Push a placeholder trial that we'll mutate if the user responds
    trialsRef.current.push({
      stimulus: letter,
      isTarget,
      responded: false,
      reactionTimeMs: null,
    });

    // Hide after stimulus window
    const showTimer = setTimeout(() => {
      setCurrentLetter(null);
      // Advance to next trial after ISI
      const isiTimer = setTimeout(() => {
        setTrialIndex((i) => i + 1);
      }, ISI_MS);
      return () => clearTimeout(isiTimer);
    }, STIMULUS_DURATION_MS);

    return () => clearTimeout(showTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, trialIndex]);

  // --- Computed results ---
  const completedTrials = phase === "results" ? trials : trialsRef.current;
  const targetTrials = completedTrials.filter((t) => t.isTarget);
  const hits = targetTrials.filter((t) => t.responded).length;
  const misses = targetTrials.filter((t) => !t.responded).length;
  const falseAlarms = completedTrials.filter(
    (t) => !t.isTarget && t.responded
  ).length;
  const accuracy =
    targetTrials.length > 0 ? (hits / targetTrials.length) * 100 : 0;
  const hitRTs = completedTrials
    .filter((t) => t.isTarget && t.responded && t.reactionTimeMs != null)
    .map((t) => t.reactionTimeMs!);
  const avgReactionTimeMs =
    hitRTs.length > 0
      ? Math.round(hitRTs.reduce((a, b) => a + b, 0) / hitRTs.length)
      : null;

  const accuracyColor =
    accuracy >= 80
      ? "var(--success)"
      : accuracy >= 60
      ? "var(--warning)"
      : "var(--danger)";

  const progressPct =
    ((DURATION_SECONDS - timeRemaining) / DURATION_SECONDS) * 100;
  const mins = Math.floor(timeRemaining / 60);
  const secs = timeRemaining % 60;

  async function handleSave() {
    setSaving(true);
    try {
      await saveCptResult({
        clientId,
        durationSeconds: DURATION_SECONDS,
        totalStimuli: completedTrials.length,
        targetCount: targetTrials.length,
        hits,
        misses,
        falseAlarms,
        avgReactionTimeMs,
        accuracy,
      });
      router.push(`/clients/${clientId}`);
    } finally {
      setSaving(false);
    }
  }

  function handleRetake() {
    setTrials([]);
    trialsRef.current = [];
    setPhase("instructions");
  }

  // --- Phase: Instructions ---
  if (phase === "instructions") {
    return (
      <div
        className="max-w-lg mx-auto rounded-xl p-8 text-center"
        style={{
          background: "var(--surface-raised)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{
            background: "color-mix(in srgb, var(--brand) 10%, transparent)",
          }}
        >
          <span
            className="text-2xl font-bold"
            style={{ color: "var(--brand)" }}
          >
            X
          </span>
        </div>

        <h2
          className="text-xl font-bold mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Continuous Performance Test
        </h2>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
          You will see letters appear one at a time. Press{" "}
          <strong>SPACE</strong> only when you see the letter{" "}
          <strong style={{ color: "var(--brand)" }}>X</strong>. Do not press
          for any other letter.
        </p>

        <div
          className="rounded-xl p-5 mb-6 flex gap-6 justify-center text-sm"
          style={{ background: "var(--surface-sunken)" }}
        >
          <div className="text-center">
            <p className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
              3 min
            </p>
            <p style={{ color: "var(--text-tertiary)" }}>Duration</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
              180
            </p>
            <p style={{ color: "var(--text-tertiary)" }}>Stimuli</p>
          </div>
          <div className="text-center">
            <p
              className="font-bold text-base"
              style={{ color: "var(--brand)" }}
            >
              X only
            </p>
            <p style={{ color: "var(--text-tertiary)" }}>Target</p>
          </div>
        </div>

        <button
          onClick={startCountdown}
          className="w-full py-3 px-6 font-bold text-base rounded-xl transition-colors"
          style={{ background: "var(--brand)", color: "#fff" }}
        >
          Begin Test →
        </button>
      </div>
    );
  }

  // --- Phase: Countdown ---
  if (phase === "countdown") {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-xl"
        style={{
          minHeight: 400,
          background: "#000",
        }}
      >
        <div
          className="text-8xl font-black tabular-nums"
          style={{ color: "#fff" }}
        >
          {countdown > 0 ? countdown : "GO!"}
        </div>
        <p className="mt-4 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
          Get ready…
        </p>
      </div>
    );
  }

  // --- Phase: Running ---
  if (phase === "running") {
    return (
      <div
        className="flex flex-col items-center rounded-xl overflow-hidden"
        style={{ minHeight: 500, background: "#000" }}
      >
        {/* Stimulus */}
        <div
          className="flex items-center justify-center flex-1 w-full"
          style={{ minHeight: 380 }}
        >
          <div
            className="select-none font-black tabular-nums"
            style={{
              fontFamily: "monospace",
              fontSize: "8rem",
              minWidth: 120,
              textAlign: "center",
              opacity: currentLetter ? 1 : 0,
              transition: "opacity 0.05s",
              color: "#fff",
            }}
          >
            {currentLetter ?? "M"}
          </div>
        </div>

        {/* Tap button for mobile */}
        <button
          onMouseDown={handleResponse}
          onTouchStart={handleResponse}
          className="mb-6 w-48 py-3 rounded-2xl font-bold text-sm transition-colors active:scale-95"
          style={{
            background: "rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.7)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          SPACE / TAP
        </button>

        {/* Progress bar */}
        <div className="w-full px-6 pb-5">
          <div className="flex justify-between text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            <span>Progress</span>
            <span>
              {mins}:{String(secs).padStart(2, "0")} remaining
            </span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.12)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${progressPct}%`,
                background: "var(--brand)",
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // --- Phase: Results ---
  return (
    <div
      className="rounded-xl border p-8"
      style={{
        background: "var(--surface-raised)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <h2
        className="text-lg font-bold mb-1"
        style={{ color: "var(--text-primary)" }}
      >
        Test Complete
      </h2>
      <p className="text-sm mb-6" style={{ color: "var(--text-tertiary)" }}>
        CPT results summary
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          {
            label: "Accuracy",
            value: `${accuracy.toFixed(1)}%`,
            color: accuracyColor,
          },
          {
            label: "Avg Response Time",
            value: avgReactionTimeMs != null ? `${avgReactionTimeMs} ms` : "—",
            color: "var(--brand)",
          },
          {
            label: "Hits",
            value: String(hits),
            color: "var(--success)",
          },
          {
            label: "Misses",
            value: String(misses),
            color: "var(--warning)",
          },
          {
            label: "False Alarms",
            value: String(falseAlarms),
            color: "var(--danger)",
          },
          {
            label: "Total Stimuli",
            value: String(completedTrials.length),
            color: "var(--text-primary)",
          },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-xl p-4"
            style={{ background: "var(--surface-sunken)" }}
          >
            <p
              className="text-xs mb-1"
              style={{ color: "var(--text-tertiary)" }}
            >
              {label}
            </p>
            <p
              className="text-2xl font-bold tabular-nums"
              style={{ color }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2.5 px-5 font-semibold rounded-xl transition-colors disabled:opacity-50"
          style={{ background: "var(--brand)", color: "var(--text-inverse)" }}
        >
          {saving ? "Saving…" : "Save Results"}
        </button>
        <button
          onClick={handleRetake}
          disabled={saving}
          className="py-2.5 px-5 font-medium rounded-xl border transition-colors text-sm disabled:opacity-50"
          style={{
            color: "var(--text-secondary)",
            borderColor: "var(--border-default)",
            background: "var(--surface-raised)",
          }}
        >
          Retake Test
        </button>
      </div>
    </div>
  );
}
