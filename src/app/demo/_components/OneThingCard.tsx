"use client";

import { HOME_USER_STREAK, SARAH_SESSIONS } from "../_data/sessions";
import { WEARABLE_SYNC } from "../_data/wearable-sync";

// Single, opinionated, *non-prescriptive* daily suggestion. Decision tree
// over the data we already have. No LLM. One sentence + one button.
// Per Stanford HAI 2026 research: nonprescriptive single-line AI beats full
// recommendation engines for home-user adherence.
//
// Decision priority (first match wins):
//   1. Sleep was light → recommend a Calm session
//   2. Streak nearly hit a 7-day milestone, no session today → push it
//   3. Last focus score low → suggest a morning session next time
//   4. Mood not logged in 2+ days → quick check-in
//   5. Default → calm-before-bed nudge

interface OneThingCardProps {
  onStartSession: () => void;
  onOpenCheckIn: () => void;
}

type Suggestion = {
  text: string;
  cta: string;
  action: "start" | "checkin" | "schedule";
};

function pickSuggestion(): Suggestion {
  // Sleep last 2 nights (from Oura sample); below 6.5h average → tired
  const ouraSleep = WEARABLE_SYNC.oura?.metrics.find((m) => m.label === "Sleep")?.value ?? "";
  const sleepHrsMatch = ouraSleep.match(/(\d+)h/);
  const sleepHrs = sleepHrsMatch ? Number(sleepHrsMatch[1]) : 8;
  if (sleepHrs < 7) {
    return {
      text: "A short Calm session might help — your sleep was light the last 2 nights.",
      cta: "Start 5-min Calm",
      action: "start",
    };
  }

  // Streak ≥ 6 days and not trained today → 'one more day' push
  const trainedDays = HOME_USER_STREAK.filter((d) => d.trained).length;
  const today = HOME_USER_STREAK[HOME_USER_STREAK.length - 1];
  if (trainedDays >= 5 && !today.trained) {
    return {
      text: `You're 1 day from a 7-day streak. 12 minutes does it.`,
      cta: "Start 12-min Focus",
      action: "start",
    };
  }

  // Last focus score < 60 → morning session reminder
  const lastFocus = SARAH_SESSIONS[0]?.focusScore ?? 70;
  if (lastFocus < 60) {
    return {
      text: "Try a morning session tomorrow — your morning sessions average 12 points higher.",
      cta: "Add to schedule",
      action: "schedule",
    };
  }

  // Default: gentle calm-before-bed nudge
  return {
    text: "You're on track. A 10-min Calm session before bed locks in the streak.",
    cta: "Start 10-min Calm",
    action: "start",
  };
}

export function OneThingCard({ onStartSession, onOpenCheckIn }: OneThingCardProps) {
  const s = pickSuggestion();

  function handleClick() {
    if (s.action === "checkin") onOpenCheckIn();
    else onStartSession();
    // 'schedule' falls through to start in the demo
  }

  return (
    <section className="mb-12">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Today&rsquo;s one thing</h2>
        <p className="text-[10px] text-gray-400">From your last 12 sessions</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <p className="text-base text-gray-800 leading-relaxed mb-4">{s.text}</p>
        <button
          onClick={handleClick}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          {s.cta}
          <span aria-hidden>→</span>
        </button>
      </div>
    </section>
  );
}
