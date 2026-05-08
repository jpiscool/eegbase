"use client";
import { useState, useEffect, useRef, useCallback } from "react";

interface Trial {
  shape: "circle" | "triangle";
  isTarget: boolean;
  responded: boolean;
  reactionTimeMs: number | null;
  stimulusOnsetMs: number;
}

interface Summary {
  totalTrials: number;
  targetCount: number;
  hits: number;
  misses: number;
  falseAlarms: number;
  avgReactionTimeMs: number | null;
  accuracy: number;
  durationSeconds: number;
}

interface Props {
  onComplete: (summary: Summary) => void;
}

const TOTAL_TRIALS = 150;
const TARGET_RATIO = 0.15; // ~15% triangles
const DISPLAY_MS = 600;
const BLANK_MS = 400;

type Phase = "instructions" | "countdown" | "running" | "done";

export function ERPTest({ onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>("instructions");
  const [countdown, setCountdown] = useState(3);
  const [currentShape, setCurrentShape] = useState<"circle" | "triangle" | null>(null);
  const [trialIndex, setTrialIndex] = useState(0);
  const [showShape, setShowShape] = useState(false);

  const trialsRef = useRef<Trial[]>([]);
  const stimulusOnsetRef = useRef<number>(0);
  const respondedThisTrialRef = useRef(false);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build randomized trial sequence
  function buildTrials(): Trial[] {
    const targets = Math.round(TOTAL_TRIALS * TARGET_RATIO);
    const arr: Trial[] = [];
    for (let i = 0; i < TOTAL_TRIALS; i++) {
      const isTarget = i < targets;
      arr.push({ shape: isTarget ? "triangle" : "circle", isTarget, responded: false, reactionTimeMs: null, stimulusOnsetMs: 0 });
    }
    // Fisher-Yates shuffle
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  const runTrial = useCallback((index: number) => {
    if (index >= TOTAL_TRIALS) {
      setPhase("done");
      const trials = trialsRef.current;
      const targets = trials.filter((t) => t.isTarget);
      const hits = targets.filter((t) => t.responded).length;
      const misses = targets.filter((t) => !t.responded).length;
      const falseAlarms = trials.filter((t) => !t.isTarget && t.responded).length;
      const rts = trials.filter((t) => t.isTarget && t.responded && t.reactionTimeMs != null).map((t) => t.reactionTimeMs!);
      const avgRt = rts.length > 0 ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : null;
      const accuracy = targets.length > 0 ? (hits / targets.length) * 100 : 0;
      const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
      onComplete({
        totalTrials: TOTAL_TRIALS,
        targetCount: targets.length,
        hits,
        misses,
        falseAlarms,
        avgReactionTimeMs: avgRt,
        accuracy,
        durationSeconds,
      });
      return;
    }

    const trial = trialsRef.current[index];
    respondedThisTrialRef.current = false;
    trial.stimulusOnsetMs = Date.now() - startTimeRef.current;
    stimulusOnsetRef.current = Date.now();
    setCurrentShape(trial.shape);
    setShowShape(true);
    setTrialIndex(index);

    timerRef.current = setTimeout(() => {
      setShowShape(false);
      timerRef.current = setTimeout(() => {
        runTrial(index + 1);
      }, BLANK_MS);
    }, DISPLAY_MS);
  }, [onComplete]);

  function startTest() {
    trialsRef.current = buildTrials();
    startTimeRef.current = Date.now();
    setPhase("running");
    runTrial(0);
  }

  function beginCountdown() {
    setPhase("countdown");
    setCountdown(3);
  }

  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      startTest();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // Space bar handler
  useEffect(() => {
    if (phase !== "running") return;
    function handleKey(e: KeyboardEvent) {
      if (e.code !== "Space" || e.repeat) return;
      e.preventDefault();
      if (respondedThisTrialRef.current) return;
      respondedThisTrialRef.current = true;
      const rt = Date.now() - stimulusOnsetRef.current;
      const trial = trialsRef.current[trialIndex];
      if (trial) {
        trial.responded = true;
        trial.reactionTimeMs = showShape ? rt : null; // only RT if shape still visible
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase, trialIndex, showShape]);

  // Cleanup timers on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const progress = Math.round((trialIndex / TOTAL_TRIALS) * 100);

  if (phase === "instructions") {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>ERP / P300 Assessment</h2>
        <div className="rounded-xl p-8 mb-6 text-left space-y-4" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
          <p style={{ color: "var(--text-primary)" }}>This test measures your brain's event-related response to rare targets.</p>
          <ul className="space-y-2 text-sm list-disc list-inside" style={{ color: "var(--text-secondary)" }}>
            <li>Shapes will appear one at a time on the screen.</li>
            <li>Most shapes will be <strong>circles</strong> — ignore these.</li>
            <li>Occasionally a <strong>triangle</strong> will appear — press <kbd className="px-2 py-0.5 rounded font-mono text-xs" style={{ background: "var(--surface-sunken)", border: "1px solid var(--border-default)" }}>SPACE</kbd> as quickly as possible when you see it.</li>
            <li>Try not to press SPACE for circles.</li>
            <li>The test takes approximately 2.5 minutes.</li>
          </ul>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Ensure the participant is seated comfortably and focused before beginning.</p>
        </div>
        <button
          onClick={beginCountdown}
          className="px-8 py-3 font-semibold rounded-xl transition-colors"
          style={{ background: "var(--brand)", color: "#fff" }}
        >
          Begin Test
        </button>
      </div>
    );
  }

  if (phase === "countdown") {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-8xl font-bold tabular-nums" style={{ color: "var(--brand)" }}>{countdown || "Go!"}</p>
      </div>
    );
  }

  if (phase === "running") {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: 400 }}>
        {/* Progress */}
        <div className="w-full max-w-md mb-8">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-sunken)" }}>
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: "var(--brand)" }} />
          </div>
          <p className="text-xs text-right mt-1" style={{ color: "var(--text-tertiary)" }}>{trialIndex}/{TOTAL_TRIALS}</p>
        </div>

        {/* Stimulus */}
        <div className="w-48 h-48 flex items-center justify-center">
          {showShape ? (
            currentShape === "circle" ? (
              <svg viewBox="0 0 100 100" className="w-36 h-36">
                <circle cx="50" cy="50" r="45" fill="#3B82F6" />
              </svg>
            ) : (
              <svg viewBox="0 0 100 100" className="w-36 h-36">
                <polygon points="50,5 95,95 5,95" fill="#EF4444" />
              </svg>
            )
          ) : (
            <div className="w-36 h-36" />
          )}
        </div>

        <p className="text-xs mt-8" style={{ color: "var(--text-tertiary)" }}>Press <kbd className="px-1.5 py-0.5 rounded font-mono text-xs" style={{ background: "var(--surface-sunken)", border: "1px solid var(--border-default)" }}>SPACE</kbd> when you see a triangle</p>
      </div>
    );
  }

  // done phase — parent handles results display
  return null;
}
