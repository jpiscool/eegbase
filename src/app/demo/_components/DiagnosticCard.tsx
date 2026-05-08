"use client";

import { useState } from "react";

// "Why isn't training working?" diagnostic. Universal complaint across every
// neurofeedback app: 'I trained for 3 weeks and feel nothing.'
// Per the Nature 2025 ADHD meta-analysis, ~1,260 minutes of training is the
// effect threshold — about 60 sessions of 21 minutes each. Most home users
// quit at 15 sessions thinking it failed, when they were 3/4 of the way to
// the dose where it kicks in.
//
// The diagnostic shows where the user is on that arc + the most likely
// reason any plateau is happening.

const TYPICAL_DOSE_MINUTES = 1260;
const SARAH_SESSIONS_DONE = 8;
const SARAH_AVG_MIN = 21;
const SARAH_TOTAL_MIN = SARAH_SESSIONS_DONE * SARAH_AVG_MIN;
const SARAH_PCT = Math.round((SARAH_TOTAL_MIN / TYPICAL_DOSE_MINUTES) * 100);

type Reason = {
  id: string;
  title: string;
  detail: string;
  status: "ok" | "watch" | "act";
};

const REASONS: Reason[] = [
  {
    id: "dose",
    title: "Dose so far",
    detail: `${SARAH_TOTAL_MIN} of ~${TYPICAL_DOSE_MINUTES} minutes typical. The Nature 2025 ADHD meta-analysis puts the effect threshold around 1,260 min — about 60 sessions of 21 min. You\u2019re ${SARAH_PCT}% of the way.`,
    status: "watch",
  },
  {
    id: "signal",
    title: "Signal quality",
    detail: "All 8 sessions had clean signal (no flagged artifacts). This isn\u2019t a hardware issue.",
    status: "ok",
  },
  {
    id: "consistency",
    title: "Consistency",
    detail: "You\u2019ve trained on 6 of the last 7 days. Streak intact. Keep going \u2014 this is the part that matters most.",
    status: "ok",
  },
  {
    id: "sleep",
    title: "Sleep before sessions",
    detail: "Sessions following <7 hours of sleep are 14 points lower on focus score. Try to train mornings after a full night.",
    status: "act",
  },
];

interface DiagnosticCardProps {
  open: boolean;
  setOpen: (v: boolean) => void;
}

export function DiagnosticCard({ open, setOpen }: DiagnosticCardProps) {
  if (!open) return null;

  function pillFor(s: Reason["status"]) {
    if (s === "ok")    return { bg: "#10B98114", fg: "#047857", label: "Looks good" };
    if (s === "watch") return { bg: "#F59E0B14", fg: "#92400E", label: "On track" };
    return                       { bg: "#EF444414", fg: "#B91C1C", label: "Try this" };
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Why isn't training working"
      onClick={() => setOpen(false)}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 max-h-[85vh] flex flex-col"
      >
        <div className="px-6 pt-6 pb-3 flex-shrink-0 border-b border-gray-100">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Honest read</p>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-1">Why isn&rsquo;t this working yet?</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Quick look at the four things that usually explain a plateau.
          </p>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4">
          {/* Dose progress bar — the headline */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-5">
            <div className="flex items-baseline justify-between mb-2">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Where you are on the arc</p>
              <p className="text-xs text-blue-700 tabular-nums">{SARAH_PCT}%</p>
            </div>
            <div className="h-2 rounded-full bg-blue-200/60 overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${SARAH_PCT}%` }} />
            </div>
            <p className="text-sm text-gray-800 leading-relaxed mt-3">
              You&rsquo;ve done <span className="font-semibold tabular-nums">{SARAH_TOTAL_MIN} min</span> of training. Most people start to feel a real shift around <span className="font-semibold tabular-nums">{TYPICAL_DOSE_MINUTES} min</span>. You&rsquo;re early, not stuck.
            </p>
          </div>

          {/* Reasons */}
          <ul className="space-y-2">
            {REASONS.map((r) => {
              const pill = pillFor(r.status);
              return (
                <li key={r.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <span className="text-sm font-semibold text-gray-900">{r.title}</span>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: pill.bg, color: pill.fg }}
                    >
                      {pill.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{r.detail}</p>
                </li>
              );
            })}
          </ul>

          <p className="text-[11px] text-gray-400 leading-relaxed mt-5">
            Source: Nature Scientific Reports 2025 · &lsquo;Neurofeedback for ADHD executive function meta-analysis.&rsquo;
          </p>
        </div>

        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end flex-shrink-0">
          <button
            onClick={() => setOpen(false)}
            className="px-4 py-2 text-sm text-gray-700 font-semibold hover:text-gray-900"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
