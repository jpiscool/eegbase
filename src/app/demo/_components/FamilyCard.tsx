"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "eegbase-demo-family";

// Family / parent-child mode. Shown on the home-user "Your training" detail
// (or in Settings, but more discoverable here). One opinionated abstraction:
// a "household" the user can add up to 3 people to, each with their own
// streak. Tapping a household member switches into their view.
//
// Per research: PIGPUG and Myndlift have entered the kid-NF space but neither
// has a true 'family unit' abstraction. Couples HRV-coherence mode is also
// in the gap.

type Member = {
  id: string;
  name: string;
  relationship: string;
  initials: string;
  streakDays: number;
  trainedToday: boolean;
};

const DEFAULT_HOUSEHOLD: Member[] = [
  { id: "you",     name: "You",            relationship: "self",     initials: "Y",  streakDays: 5, trainedToday: false },
  { id: "partner", name: "Sam",            relationship: "Partner",  initials: "Sa", streakDays: 3, trainedToday: true  },
  { id: "child",   name: "Maya, age 11",   relationship: "Child",    initials: "Ma", streakDays: 7, trainedToday: true  },
];

export function FamilyCard() {
  const [members, setMembers] = useState<Member[]>(DEFAULT_HOUSEHOLD);
  const [coherenceOn, setCoherenceOn] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v) {
        const parsed = JSON.parse(v);
        if (Array.isArray(parsed)) setMembers(parsed);
      }
      setCoherenceOn(localStorage.getItem("eegbase-demo-coherence") === "on");
    } catch {}
  }, []);

  function toggleCoherence() {
    const next = !coherenceOn;
    setCoherenceOn(next);
    try { localStorage.setItem("eegbase-demo-coherence", next ? "on" : "off"); } catch {}
  }

  // Don't render if the user opted out of household features (we don't currently
  // expose that toggle but the structure is here for future use).
  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
      <div className="flex items-baseline justify-between mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Household</p>
        <button className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold">+ Invite</button>
      </div>

      <ul className="space-y-3 mb-5">
        {members.map((m) => {
          const isYou = m.id === "you";
          const dotColor = m.trainedToday ? "#10B981" : m.streakDays >= 5 ? "#F59E0B" : "#94A3B8";
          return (
            <li key={m.id} className="flex items-center gap-3">
              <span className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-xs flex-shrink-0 ${
                isYou ? "bg-blue-100 text-blue-700" :
                m.relationship === "Child" ? "bg-amber-100 text-amber-700" : "bg-violet-100 text-violet-700"
              }`}>
                {m.initials}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-gray-900">
                  {m.name}
                  <span className="text-xs font-normal text-gray-400 ml-2">{m.relationship !== "self" ? m.relationship : "you"}</span>
                </span>
                <span className="block text-xs text-gray-500 mt-0.5 inline-flex items-center gap-1.5">
                  <span aria-hidden className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor }} />
                  <span className="tabular-nums">{m.streakDays}-day streak</span>
                  {m.trainedToday && <span className="text-emerald-700 ml-1">· trained today</span>}
                </span>
              </span>
              {!isYou && (
                <button
                  className="text-[11px] text-gray-500 hover:text-gray-900 px-2 py-1.5"
                  aria-label={`Switch to ${m.name}\u2019s view`}
                >
                  Open
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {/* Couples coherence — opinionated, single toggle */}
      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-start gap-3">
          <span className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center text-base flex-shrink-0" aria-hidden>
            {"\u{1F49E}"}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">Couples HRV coherence</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              Train together. Two Polar straps, one shared session, a single coherence score that climbs when both nervous systems sync.
            </p>
          </div>
          <button
            onClick={toggleCoherence}
            role="switch"
            aria-checked={coherenceOn}
            aria-label={`Couples coherence ${coherenceOn ? "on" : "off"}`}
            className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 mt-0.5 ${coherenceOn ? "bg-blue-600" : "bg-gray-300"}`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${coherenceOn ? "left-[22px]" : "left-0.5"}`}
            />
          </button>
        </div>
      </div>
    </section>
  );
}
