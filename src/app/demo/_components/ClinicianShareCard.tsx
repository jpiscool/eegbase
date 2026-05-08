"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "eegbase-demo-share";

// Home-user-only card: lets the user toggle whether their training data is
// shared with a clinician. When ON, shows the clinician's name + when they
// last looked. Single-tap toggle, no settings page, no modal.
//
// This is the bridge feature for the Mendi pitch — a Mendi-attached clinic
// only works if home users can share their data with their clinician trivially.

export function ClinicianShareCard() {
  const [shared, setShared] = useState(true);
  // The illustrative "linked clinician" — in the real app this would be a
  // clinic invite / paired clinician id from the user's account.
  const linkedClinician = "Dr. Maya Chen";
  const lastViewed = "yesterday";

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "off") setShared(false);
      if (v === "on")  setShared(true);
    } catch {}
  }, []);

  function toggle() {
    const next = !shared;
    setShared(next);
    try { localStorage.setItem(STORAGE_KEY, next ? "on" : "off"); } catch {}
  }

  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
      <div className="flex items-center gap-3">
        <span
          className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
            shared ? "bg-blue-50" : "bg-gray-100"
          }`}
          aria-hidden
        >
          {shared ? "\u{1F517}" : "\u{1F512}"}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">
            {shared ? `Sharing with ${linkedClinician}` : "Private — only you"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {shared
              ? `She can see your sessions and notes. Last looked ${lastViewed}.`
              : "Turn this on to send your data to your clinician."}
          </p>
        </div>
        {/* Toggle switch */}
        <button
          onClick={toggle}
          role="switch"
          aria-checked={shared}
          aria-label={shared ? "Stop sharing" : "Start sharing"}
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
            shared ? "bg-blue-600" : "bg-gray-300"
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${
              shared ? "left-[22px]" : "left-0.5"
            }`}
          />
        </button>
      </div>
    </section>
  );
}
