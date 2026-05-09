"use client";

import { Sparkline } from "./Sparkline";

// Cross-source insight: how Calm sessions correlate with next-night recovery.
// Lifted from the WearableSync (Oura readiness) plus session history. The
// numbers are illustrative; the shape of the story is the same in real data.
//
// Two paired 14-day series — readiness on the nights before/after a Calm
// session, vs nights without one. Sparkline shows the "with-session" trend
// rising slightly above baseline.

const READINESS_AFTER_CALM = [78, 82, 80, 84, 86, 83, 87, 85, 88, 86, 89, 91, 88, 92];
const DELTA_VS_BASELINE = 12; // average +12 readiness on Calm-session nights

export function SleepImpactCard() {
  return (
    <section className="mb-12">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sleep impact</h2>
        <p className="text-xs text-gray-400">Last 30 nights · Oura</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <p className="text-base text-gray-800 leading-relaxed mb-4">
          On nights you ran a <span className="font-semibold text-gray-900">Calm session</span>, your readiness was{" "}
          <span className="font-semibold tabular-nums text-emerald-600">+{DELTA_VS_BASELINE}</span>{" "}vs nights you didn&rsquo;t.
        </p>
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1">
            <Sparkline data={READINESS_AFTER_CALM} width={220} height={42} color="#10B981" />
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900 tabular-nums leading-none">{READINESS_AFTER_CALM[READINESS_AFTER_CALM.length - 1]}</p>
            <p className="text-[10px] text-gray-400 mt-1">last night</p>
          </div>
        </div>
      </div>
    </section>
  );
}
