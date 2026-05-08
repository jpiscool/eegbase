"use client";

import { useState } from "react";
import { SARAH_INSIGHTS, type Insight } from "../_data/insights";

interface InsightsListProps {
  // Heading copy adapts to who's looking — the clinician sees "AI patterns
  // for {first name}", the home user sees "Your patterns".
  audience: "clinician" | "home";
  patientFirstName?: string;
}

export function InsightsList({ audience, patientFirstName = "your client" }: InsightsListProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(0); // first one expanded by default
  const insights = SARAH_INSIGHTS;
  const heading = audience === "home"
    ? "Your patterns"
    : `What we're seeing for ${patientFirstName}`;

  function chipColor(c: Insight["confidence"]) {
    if (c === "high")   return { bg: "#10B98114", fg: "#047857" };
    if (c === "medium") return { bg: "#F59E0B14", fg: "#92400E" };
    return                       { bg: "#94A3B814", fg: "#475569" };
  }

  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{heading}</p>
        <span className="text-[10px] text-gray-400">AI-detected · click to see why</span>
      </div>
      <ul className="divide-y divide-gray-100 -mx-5">
        {insights.map((ins, i) => {
          const open = openIdx === i;
          const c = chipColor(ins.confidence);
          return (
            <li key={ins.id}>
              <button
                onClick={() => setOpenIdx(open ? null : i)}
                className="w-full text-left px-5 py-3 hover:bg-gray-50/60 transition-colors"
                aria-expanded={open}
              >
                <div className="flex items-start gap-3">
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-gray-900 leading-snug">{ins.headline}</span>
                    {open && (
                      <>
                        <span className="block text-sm text-gray-700 leading-relaxed mt-2">{ins.detail}</span>
                        <span className="block text-[10px] text-gray-500 mt-2 uppercase tracking-wider">From: {ins.source}</span>
                      </>
                    )}
                  </span>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5"
                    style={{ background: c.bg, color: c.fg }}
                    aria-label={`${ins.confidence} confidence`}
                  >
                    {ins.confidence}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
