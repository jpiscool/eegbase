"use client";

import { useEffect, useState } from "react";

const SHARE_KEY = "eegbase-demo-share";
const NOTE_KEY = "eegbase-demo-live-note";

// Patient-facing pill + expandable panel that appears in the SessionView when
// the home user has share-with-clinician turned on (Phase 13). The panel
// shows the linked clinician's avatar + a live note feed they're typing.

export function LiveCoFeedbackPill() {
  const [shared, setShared] = useState(false);
  const [open, setOpen] = useState(false);
  const [latestNote, setLatestNote] = useState("");

  useEffect(() => {
    try {
      setShared(localStorage.getItem(SHARE_KEY) === "on");
      setLatestNote(localStorage.getItem(NOTE_KEY) ?? "");
    } catch {}
    function onStorage(e: StorageEvent) {
      if (e.key === SHARE_KEY) setShared(localStorage.getItem(SHARE_KEY) === "on");
      if (e.key === NOTE_KEY)  setLatestNote(localStorage.getItem(NOTE_KEY) ?? "");
    }
    // Poll for same-tab updates from the clinician panel (storage events
    // don't fire in the same tab; keep it cheap, every 1.5s).
    const tick = setInterval(() => {
      try {
        const v = localStorage.getItem(NOTE_KEY) ?? "";
        setLatestNote((prev) => (prev === v ? prev : v));
      } catch {}
    }, 1500);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(tick);
    };
  }, []);

  if (!shared) return null;

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl mb-6 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-emerald-100/50 transition-colors"
        aria-expanded={open}
      >
        <span className="relative w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0">
          <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" aria-hidden />
        </span>
        <span className="flex-1 min-w-0 text-sm">
          <span className="font-semibold text-emerald-900">Watching with Dr. Maya Chen</span>
          <span className="text-emerald-700/70 ml-2 text-xs">online · live</span>
        </span>
        <span className="text-emerald-700 text-xs font-semibold" aria-hidden>{open ? "—" : "+"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-emerald-200/60">
          <div className="flex items-start gap-3">
            <span className="w-9 h-9 rounded-full bg-emerald-200 text-emerald-800 font-semibold text-xs flex items-center justify-center flex-shrink-0">
              MC
            </span>
            <div className="flex-1 min-w-0">
              {latestNote ? (
                <p className="text-sm text-emerald-900 leading-relaxed bg-white border border-emerald-200/60 rounded-xl px-3 py-2">
                  {latestNote}
                </p>
              ) : (
                <p className="text-xs text-emerald-700/70 italic">She&rsquo;s watching. Notes will appear here when she sends them.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Clinician-facing floating panel. Renders at the bottom-right of the patient
// detail when Sarah's "in session." Shows the live focus score (read from a
// localStorage poll the patient SessionView writes) and a note composer that
// sends to the patient via NOTE_KEY.

const LIVE_SCORE_KEY = "eegbase-demo-live-score";

export function ClinicianWatchPanel({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const [score, setScore] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [sentFlash, setSentFlash] = useState(false);

  useEffect(() => {
    if (!open) return;
    function read() {
      try {
        const v = localStorage.getItem(LIVE_SCORE_KEY);
        setScore(v == null ? null : Number(v));
      } catch {}
    }
    read();
    const tick = setInterval(read, 1000);
    return () => clearInterval(tick);
  }, [open]);

  function send() {
    if (!note.trim()) return;
    try { localStorage.setItem(NOTE_KEY, note.trim()); } catch {}
    setNote("");
    setSentFlash(true);
    setTimeout(() => setSentFlash(false), 1500);
  }

  if (!open) return null;

  const accent =
    score == null ? "#94A3B8" :
    score >= 70 ? "#10B981" :
    score >= 40 ? "#F59E0B" :
                  "#94A3B8";

  return (
    <div
      role="dialog"
      aria-label="Watch live session"
      className="fixed bottom-6 right-6 z-40 w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="relative w-2 h-2 rounded-full bg-emerald-500">
            <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" aria-hidden />
          </span>
          <span className="text-sm font-semibold text-gray-900">Sarah is in session</span>
        </div>
        <button
          onClick={() => setOpen(false)}
          aria-label="Close watch panel"
          className="text-gray-400 hover:text-gray-700 text-sm"
        >
          ×
        </button>
      </div>

      <div className="px-4 py-4 text-center">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Focus score</p>
        <p className="text-5xl font-extrabold tabular-nums tracking-tight" style={{ color: accent }}>
          {score ?? "—"}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {score == null ? "Not recording yet"
            : score >= 70 ? "On target"
            : score >= 40 ? "Building up"
            : "Settling in"}
        </p>
      </div>

      <div className="px-4 pb-4">
        <label htmlFor="live-note" className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Send a note
        </label>
        <div className="flex gap-2">
          <input
            id="live-note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            placeholder="Try a longer exhale here…"
            className="flex-1 min-w-0 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-300"
          />
          <button
            onClick={send}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex-shrink-0"
          >
            {sentFlash ? "Sent ✓" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper so the SessionView can broadcast the current score without importing
// localStorage logic. Called from inside the live tick.
export function broadcastLiveScore(score: number) {
  try { localStorage.setItem(LIVE_SCORE_KEY, String(score)); } catch {}
}
export function clearLiveScore() {
  try { localStorage.removeItem(LIVE_SCORE_KEY); } catch {}
}
