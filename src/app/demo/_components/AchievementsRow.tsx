"use client";

import { ACHIEVEMENTS } from "../_data/achievements";

// Compact row of milestones. Unlocked ones are full-color; in-progress show
// a thin progress bar; locked-far-off ones are dimmed.
// One line of body text under the row points at the next milestone.

export function AchievementsRow() {
  const next = ACHIEVEMENTS.find((a) => !a.unlockedAt && (a.progress ?? 0) > 0);

  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Milestones</p>
        <p className="text-[10px] text-gray-400">{ACHIEVEMENTS.filter(a => a.unlockedAt).length} of {ACHIEVEMENTS.length}</p>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {ACHIEVEMENTS.map((a) => {
          const unlocked = !!a.unlockedAt;
          const pct = a.progress ?? 0;
          return (
            <div key={a.id} className="text-center" title={`${a.label} \u2014 ${a.hint}`}>
              <div
                className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-xl mb-1.5 ${
                  unlocked ? "bg-amber-50" : "bg-gray-100"
                }`}
                style={unlocked ? {} : { filter: "grayscale(0.85)", opacity: 0.45 }}
                aria-hidden
              >
                {a.emoji}
              </div>
              <p className={`text-[10px] leading-tight ${unlocked ? "text-gray-700 font-semibold" : "text-gray-400"}`}>
                {a.label}
              </p>
              {!unlocked && pct > 0 && (
                <div className="w-8 h-0.5 mx-auto mt-1 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {next && (
        <p className="text-xs text-gray-500 mt-4 text-center">
          Next: <span className="font-semibold text-gray-900">{next.label}</span> — {next.hint}
        </p>
      )}
    </section>
  );
}
