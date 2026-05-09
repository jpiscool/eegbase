"use client";

import { useState } from "react";

// Phase 32 — One-tap "why I trained" reflection. Sits inside the post-
// session report for home users. Five chips, optional, takes 2 seconds.
// Improves AI-pattern data quality without adding any friction.
//
// State persisted in localStorage so the user's reflection stays attached
// to that session if they reopen the report.

const REASONS = [
  { id: "pre-meeting", label: "Pre-meeting" },
  { id: "couldnt-sleep", label: "Couldn't sleep" },
  { id: "scattered", label: "Felt scattered" },
  { id: "habit", label: "Just a habit" },
  { id: "stressed", label: "Stressed" },
];

const KEY = "eegbase-demo-why-trained";

export function WhyTrainedChips() {
  const [picked, setPicked] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try { return localStorage.getItem(KEY); } catch { return null; }
  });

  function pick(id: string) {
    const next = picked === id ? null : id;
    setPicked(next);
    try {
      if (next) localStorage.setItem(KEY, next);
      else localStorage.removeItem(KEY);
    } catch {}
  }

  return (
    <section className="my-6">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Why did you train? <span className="font-normal normal-case text-gray-400">(optional, 2 seconds)</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {REASONS.map((r) => {
          const on = picked === r.id;
          return (
            <button
              key={r.id}
              onClick={() => pick(r.id)}
              aria-pressed={on}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                on
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white border-gray-200 text-gray-700 hover:border-blue-300"
              }`}
            >
              {r.label}
            </button>
          );
        })}
      </div>
      {picked && (
        <p className="text-[11px] text-gray-400 mt-2">
          Saved. The AI will use this when it spots patterns next week.
        </p>
      )}
    </section>
  );
}
