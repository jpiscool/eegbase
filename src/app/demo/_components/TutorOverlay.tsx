"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "eegbase-demo-tutor";

const STEPS = [
  { title: "The big number is your focus score.",        body: "Higher is better. It moves with your brain — not your effort." },
  { title: "Pick what you see.",                          body: "Aurora is calm. Bars are clinical. Shapes are playful. Switch any time." },
  { title: "Tap Mark moment if something distracts you.", body: "We'll add a note at this exact second so you can remember it later." },
  { title: "The session ends itself.",                    body: "When time's up, the AI writes the note and you get a clean PDF." },
];

// Inline guided overlay for someone who has never run a session before.
// Default ON; user can dismiss forever ("I've done this before"). Pinned to
// the top of the SessionView so it never blocks the focus score or chart.

export function TutorOverlay() {
  const [visible, setVisible] = useState(true);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "off") setVisible(false);
    } catch {}
  }, []);

  function dismiss(forever: boolean) {
    setVisible(false);
    if (forever) {
      try { localStorage.setItem(STORAGE_KEY, "off"); } catch {}
    }
  }

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6"
      role="region"
      aria-label="First-session tutor"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
          Tutor · step {step + 1} of {STEPS.length}
        </p>
        <button
          onClick={() => dismiss(true)}
          className="text-[11px] text-blue-700/70 hover:text-blue-900 underline-offset-2 hover:underline flex-shrink-0"
        >
          I&rsquo;ve done this before
        </button>
      </div>

      <h2 className="text-base font-bold text-gray-900 mb-1">{current.title}</h2>
      <p className="text-sm text-gray-700 leading-relaxed mb-4">{current.body}</p>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              aria-hidden
              className={`block h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-blue-600" : i < step ? "w-1.5 bg-blue-400" : "w-1.5 bg-blue-200"
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="text-xs text-gray-700 hover:text-gray-900 px-2 py-1.5"
            >
              Back
            </button>
          )}
          {isLast ? (
            <button
              onClick={() => dismiss(false)}
              className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-3 py-1.5"
            >
              Got it
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-3 py-1.5"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
