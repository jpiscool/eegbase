"use client";

import { useState } from "react";

const fmtUSD = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function RoiCalculator() {
  const [clinicians, setClinicians] = useState(3);
  const [sessionsPerWeek, setSessionsPerWeek] = useState(20);
  const [pricePerSession, setPricePerSession] = useState(150);
  const [currentTool, setCurrentTool] = useState<"simplepractice" | "therapynotes" | "myndlift" | "none">("simplepractice");

  const competitorMonthly: Record<string, number> = {
    simplepractice: 99 * clinicians, // SimplePractice ~$99/clinician
    therapynotes:   69 * clinicians, // TherapyNotes ~$69/clinician
    myndlift:       150 * clinicians, // Myndlift coaching tier
    none:           0,
  };

  const eegbaseMonthly = 349; // Practice tier flat
  const annualSavingsOnSoftware = Math.max(0, (competitorMonthly[currentTool] - eegbaseMonthly) * 12);

  const sessionsPerYear = sessionsPerWeek * 50; // 50 working weeks
  const annualRevenue = sessionsPerYear * pricePerSession;

  // Admin-time savings: ~6 min per session reclaimed via AI scribe + auto-claims at $50/hr equivalent
  const adminMinutesSavedPerSession = 6;
  const adminLaborRate = 50;
  const annualAdminSavings = (sessionsPerYear * adminMinutesSavedPerSession / 60) * adminLaborRate;

  const totalAnnualSavings = annualSavingsOnSoftware + annualAdminSavings;

  return (
    <div className="bg-white border-2 border-gray-100 rounded-3xl p-7 md:p-9 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Inputs */}
        <div>
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Your practice</p>
          <h3 className="text-lg font-bold text-gray-900 mb-5">Tell us about it</h3>

          <label className="block mb-5">
            <span className="text-xs font-semibold text-gray-600 mb-1.5 block">Clinicians on your team</span>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={20}
                value={clinicians}
                onChange={(e) => setClinicians(Number(e.target.value))}
                className="flex-1 accent-blue-600"
                aria-label="Number of clinicians"
              />
              <span className="text-sm font-bold text-gray-900 tabular-nums w-12 text-right">{clinicians}</span>
            </div>
          </label>

          <label className="block mb-5">
            <span className="text-xs font-semibold text-gray-600 mb-1.5 block">Sessions per week (whole practice)</span>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={5}
                max={200}
                step={5}
                value={sessionsPerWeek}
                onChange={(e) => setSessionsPerWeek(Number(e.target.value))}
                className="flex-1 accent-blue-600"
                aria-label="Sessions per week"
              />
              <span className="text-sm font-bold text-gray-900 tabular-nums w-12 text-right">{sessionsPerWeek}</span>
            </div>
          </label>

          <label className="block mb-5">
            <span className="text-xs font-semibold text-gray-600 mb-1.5 block">Avg session price</span>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={50}
                max={400}
                step={5}
                value={pricePerSession}
                onChange={(e) => setPricePerSession(Number(e.target.value))}
                className="flex-1 accent-blue-600"
                aria-label="Average session price in dollars"
              />
              <span className="text-sm font-bold text-gray-900 tabular-nums w-16 text-right">${pricePerSession}</span>
            </div>
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-gray-600 mb-1.5 block">Currently using</span>
            <select
              value={currentTool}
              onChange={(e) => setCurrentTool(e.target.value as typeof currentTool)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
              aria-label="Current tool"
            >
              <option value="simplepractice">SimplePractice (~$99/clinician/mo)</option>
              <option value="therapynotes">TherapyNotes (~$69/clinician/mo)</option>
              <option value="myndlift">Myndlift coaching ($150/clinician/mo)</option>
              <option value="none">Pen + paper / spreadsheets</option>
            </select>
          </label>
        </div>

        {/* Outputs */}
        <div className="bg-gradient-to-br from-emerald-50 to-blue-50/30 border border-emerald-100 rounded-2xl p-6" aria-live="polite">
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">Your annual savings with EEGBase</p>
          <p className="text-4xl font-extrabold text-emerald-700 tabular-nums mb-5 leading-none">{fmtUSD(totalAnnualSavings)}<span className="text-base text-emerald-600 font-semibold ml-1">/ year</span></p>

          <div className="space-y-3 text-sm">
            <div className="flex items-baseline justify-between border-b border-emerald-100 pb-2">
              <span className="text-gray-600">Software cost difference</span>
              <span className="font-bold text-gray-900 tabular-nums">{fmtUSD(annualSavingsOnSoftware)}</span>
            </div>
            <div className="flex items-baseline justify-between border-b border-emerald-100 pb-2">
              <span className="text-gray-600">Admin time reclaimed (AI scribe + auto-claims)</span>
              <span className="font-bold text-gray-900 tabular-nums">{fmtUSD(annualAdminSavings)}</span>
            </div>
            <div className="flex items-baseline justify-between text-xs text-gray-500 pt-1">
              <span>Practice annual revenue (for context)</span>
              <span className="tabular-nums">{fmtUSD(annualRevenue)}</span>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-5 leading-relaxed">
            Estimate based on EEGBase Practice tier ($349/mo flat) and ~6 min/session admin time reclaimed at $50/hr equivalent. Real savings vary; this calculator is illustrative, not a financial promise.
          </p>
        </div>
      </div>
    </div>
  );
}
