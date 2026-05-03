"use client";
import { useEffect, useRef, useState, useCallback } from "react";

const DURATION_SECONDS = 180;    // 3-minute test
const STIMULUS_DURATION_MS = 700;
const ISI_MS = 300;              // inter-stimulus interval (blank)
const TARGET_LETTER = "X";
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWYZ"; // X excluded — added separately at ~12.5%

interface TrialResult {
  stimulus: string;
  isTarget: boolean;
  responded: boolean;
  reactionTimeMs: number | null;
}

interface Summary {
  totalStimuli: number;
  targetCount: number;
  hits: number;
  misses: number;
  falseAlarms: number;
  avgReactionTimeMs: number | null;
  accuracy: number;
  trials: TrialResult[];
}

function buildStimulusSequence(totalStimuli: number): string[] {
  const seq: string[] = [];
  for (let i = 0; i < totalStimuli; i++) {
    // ~12.5% chance of target
    if (Math.random() < 0.125) {
      seq.push(TARGET_LETTER);
    } else {
      seq.push(ALPHABET[Math.floor(Math.random() * ALPHABET.length)]);
    }
  }
  return seq;
}

function computeSummary(trials: TrialResult[]): Summary {
  const targets = trials.filter((t) => t.isTarget);
  const hits = targets.filter((t) => t.responded).length;
  const misses = targets.filter((t) => !t.responded).length;
  const falseAlarms = trials.filter((t) => !t.isTarget && t.responded).length;
  const rts = trials
    .filter((t) => t.isTarget && t.responded && t.reactionTimeMs != null)
    .map((t) => t.reactionTimeMs!);
  const avgRt = rts.length > 0 ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : null;
  const accuracy = targets.length > 0 ? (hits / targets.length) * 100 : 0;
  return {
    totalStimuli: trials.length,
    targetCount: targets.length,
    hits,
    misses,
    falseAlarms,
    avgReactionTimeMs: avgRt,
    accuracy,
    trials,
  };
}

interface Props {
  clientId: string;
  onComplete: (summary: Summary) => void;
}

type Phase = "instructions" | "countdown" | "running" | "done";

export function CPTTest({ onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>("instructions");
  const [countdown, setCountdown] = useState(3);
  const [currentLetter, setCurrentLetter] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(DURATION_SECONDS);
  const [trialIndex, setTrialIndex] = useState(0);

  const sequenceRef = useRef<string[]>([]);
  const trialsRef = useRef<TrialResult[]>([]);
  const stimulusStartRef = useRef<number>(0);
  const respondedThisTrialRef = useRef(false);
  const phaseRef = useRef<Phase>("instructions");

  // Keep phaseRef in sync
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const handleResponse = useCallback(() => {
    if (phaseRef.current !== "running") return;
    if (respondedThisTrialRef.current) return;
    respondedThisTrialRef.current = true;
    const rt = Date.now() - stimulusStartRef.current;
    const idx = trialsRef.current.length - 1;
    if (idx >= 0) {
      trialsRef.current[idx].responded = true;
      trialsRef.current[idx].reactionTimeMs = rt < STIMULUS_DURATION_MS ? rt : null;
    }
  }, []);

  // Space bar listener
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === "Space") { e.preventDefault(); handleResponse(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleResponse]);

  function startCountdown() {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, countdown]);

  function startTest() {
    const totalStimuli = Math.round(DURATION_SECONDS / ((STIMULUS_DURATION_MS + ISI_MS) / 1000));
    sequenceRef.current = buildStimulusSequence(totalStimuli);
    trialsRef.current = [];
    setTrialIndex(0);
    setTimeRemaining(DURATION_SECONDS);
    setPhase("running");
  }

  // Countdown timer (seconds remaining)
  useEffect(() => {
    if (phase !== "running") return;
    const t = setInterval(() => {
      setTimeRemaining((s) => {
        if (s <= 1) { clearInterval(t); return 0; }
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
      // Finished all stimuli
      const summary = computeSummary(trialsRef.current);
      setPhase("done");
      onComplete(summary);
      return;
    }

    const letter = seq[trialIndex];
    const isTarget = letter === TARGET_LETTER;
    setCurrentLetter(letter);
    stimulusStartRef.current = Date.now();
    respondedThisTrialRef.current = false;

    // Show stimulus
    const showTimer = setTimeout(() => {
      // Hide stimulus (blank ISI)
      setCurrentLetter(null);

      // Push trial result (responded flag may update during stimulus window)
      trialsRef.current.push({
        stimulus: letter,
        isTarget,
        responded: false,
        reactionTimeMs: null,
      });

      // Advance after ISI
      const isiTimer = setTimeout(() => {
        // Copy the responded state if user pressed during stimulus window
        setTrialIndex((i) => i + 1);
      }, ISI_MS);

      return () => clearTimeout(isiTimer);
    }, STIMULUS_DURATION_MS);

    return () => clearTimeout(showTimer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, trialIndex]);

  const progressPct = ((DURATION_SECONDS - timeRemaining) / DURATION_SECONDS) * 100;
  const mins = Math.floor(timeRemaining / 60);
  const secs = timeRemaining % 60;

  if (phase === "instructions") {
    return (
      <div className="max-w-lg mx-auto bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-5">
          <span className="text-2xl font-bold text-blue-600">X</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Continuous Performance Test</h2>
        <p className="text-sm text-gray-500 mb-6">3-minute attention assessment</p>
        <div className="text-left bg-gray-50 rounded-xl p-5 mb-6 space-y-3 text-sm text-gray-700">
          <p>Letters will appear one at a time in the center of the screen.</p>
          <p><strong>Press SPACE</strong> only when you see the letter <strong className="text-blue-600 text-base">X</strong>.</p>
          <p>Do <strong>not</strong> press for any other letter.</p>
          <p>The test lasts <strong>3 minutes</strong> with no breaks. Stay focused and respond as quickly as you can.</p>
          <p className="text-xs text-gray-400 pt-1">No feedback is given during the test — this maintains assessment validity.</p>
        </div>
        <button
          onClick={startCountdown}
          className="w-full py-3 px-6 bg-blue-600 text-white font-bold text-base rounded-xl hover:bg-blue-700 transition-colors"
        >
          Begin Test
        </button>
      </div>
    );
  }

  if (phase === "countdown") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-8xl font-black text-blue-600 tabular-nums">{countdown}</div>
        <p className="text-gray-400 mt-4 text-sm">Get ready…</p>
      </div>
    );
  }

  if (phase === "running") {
    return (
      <div className="flex flex-col items-center min-h-[500px]">
        {/* Progress bar */}
        <div className="w-full max-w-lg mb-8">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progress</span>
            <span>
              {mins}:{String(secs).padStart(2, "0")} remaining
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-1000"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Stimulus display */}
        <div
          className="flex items-center justify-center flex-1 w-full"
          style={{ minHeight: 320 }}
        >
          <div
            className="text-9xl font-black text-gray-900 tabular-nums select-none"
            style={{
              fontFamily: "monospace",
              minWidth: 120,
              textAlign: "center",
              opacity: currentLetter ? 1 : 0,
              transition: "opacity 0.05s",
            }}
          >
            {currentLetter ?? ""}
          </div>
        </div>

        <button
          onMouseDown={handleResponse}
          className="mt-6 w-64 py-4 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg border border-gray-200 transition-colors active:scale-95"
        >
          SPACE / TAP
        </button>
        <p className="text-xs text-gray-400 mt-3">Press Space or tap the button when you see X</p>
      </div>
    );
  }

  return null;
}
