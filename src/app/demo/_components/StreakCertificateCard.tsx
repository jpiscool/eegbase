"use client";

import { useState } from "react";

// Phase 30 — Streak certificate. Per research: shareable certificates at
// 7/30/100-day milestones double social referrals for adherence apps.
// Card sits on the home Today between the streak strip and Today's One
// Thing. Two states:
//
//   1. NOT YET — "1 day to your first certificate" with a sub-progress bar
//   2. EARNED — opens a modal showing the printable/shareable certificate
//
// The certificate itself is rendered as plain HTML so cmd-P prints to PDF
// cleanly. Copy is generic enough that any user (clinical or home) sees
// themselves in it.

const MILESTONES = [
  { days: 7,   title: "First Week",    body: "Seven days of consistent training. The hardest streak to build is the first." },
  { days: 30,  title: "First Month",   body: "Thirty days. The neuroplasticity research says this is where measurable change starts." },
  { days: 100, title: "Hundred Days",  body: "A hundred days. Most people who start neurofeedback never make it here. You did." },
];

interface StreakCertificateCardProps {
  trainedDays: number; // out of last 7
}

export function StreakCertificateCard({ trainedDays }: StreakCertificateCardProps) {
  const [open, setOpen] = useState(false);

  // Demo: pretend the user has a 6-day current streak so the card sits
  // 1 day shy of the 7-day cert (drives the call to action).
  const currentStreak = trainedDays >= 6 ? trainedDays : 6;
  const earned = MILESTONES.filter((m) => currentStreak >= m.days);
  const next = MILESTONES.find((m) => currentStreak < m.days);
  const justEarned = earned[earned.length - 1];

  return (
    <>
      <section className="mb-12">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Milestones</h2>
          <p className="text-xs text-gray-400">Print, frame, share. Or don&rsquo;t.</p>
        </div>

        {!justEarned && next && (
          <button
            onClick={() => setOpen(true)}
            className="w-full text-left bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-300 transition-colors group"
          >
            <p className="text-base text-gray-800 leading-relaxed mb-2">
              <span className="font-semibold tabular-nums text-gray-900">{next.days - currentStreak}</span>{" "}
              {next.days - currentStreak === 1 ? "day" : "days"} to your{" "}
              <span className="font-semibold text-blue-600">{next.title}</span> certificate.
            </p>
            <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all"
                style={{ width: `${Math.round((currentStreak / next.days) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 group-hover:text-blue-600 transition-colors">
              Preview the certificate →
            </p>
          </button>
        )}

        {justEarned && (
          <button
            onClick={() => setOpen(true)}
            className="w-full text-left bg-gradient-to-br from-blue-50 to-violet-50 border border-blue-100 rounded-2xl p-5 hover:border-blue-300 transition-colors"
          >
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Certificate earned</p>
            <p className="text-base text-gray-800 leading-relaxed mb-2">
              You hit your <span className="font-semibold text-gray-900">{justEarned.title}</span> milestone.
            </p>
            <p className="text-xs text-gray-500">View, print, or share it →</p>
          </button>
        )}
      </section>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Certificate"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm no-print"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 max-h-[90vh] flex flex-col"
          >
            {/* The actual certificate — print-friendly, no chrome */}
            <div className="overflow-y-auto flex-1 bg-gradient-to-br from-blue-50 to-violet-50 p-10">
              <div className="bg-white border-4 border-double border-blue-300 rounded-xl p-12 text-center">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-[0.2em] mb-2">EEGBase</p>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-8">Certificate of Practice</p>

                <p className="text-sm text-gray-600 mb-3">This recognises</p>
                <p className="text-3xl font-bold text-gray-900 mb-3 tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
                  Sarah Mitchell
                </p>
                <p className="text-sm text-gray-600 mb-8">
                  for completing the
                </p>

                <p
                  className="text-5xl font-bold text-blue-600 mb-3 tracking-tight"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {(justEarned ?? next)?.title}
                </p>
                <p className="text-sm text-gray-600 leading-relaxed max-w-md mx-auto mb-10">
                  {(justEarned ?? next)?.body}
                </p>

                <div className="flex items-center justify-center gap-12 pt-6 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Date</p>
                    <p className="text-sm font-semibold text-gray-900 tabular-nums">
                      {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Sessions</p>
                    <p className="text-sm font-semibold text-gray-900 tabular-nums">{(justEarned ?? next)?.days ?? 7}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Issued by</p>
                    <p className="text-sm font-semibold text-gray-900">EEGBase</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action row — outside the printable area */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3 flex-shrink-0">
              <button
                onClick={() => setOpen(false)}
                className="text-sm text-gray-500 hover:text-gray-900"
              >
                Close
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
                >
                  Print / save PDF
                </button>
                <button
                  onClick={() => {
                    const text = `I just earned my ${(justEarned ?? next)?.title} certificate on EEGBase. ${(justEarned ?? next)?.body}`;
                    navigator.clipboard?.writeText(text).catch(() => {});
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Copy share text
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
