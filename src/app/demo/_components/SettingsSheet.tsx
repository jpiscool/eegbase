"use client";

import { useEffect, useRef, useState } from "react";
import { PrivacySheet } from "./PrivacySheet";

const STORAGE_PREFIX = "eegbase-demo-pref-";
const NOTIF_KEY = "eegbase-demo-notif";

type Pref = { id: string; label: string; hint: string; defaultOn: boolean };

const PREFS: Pref[] = [
  { id: "sound",         label: "Session sounds",        hint: "Soft chimes for start, end, and milestones",       defaultOn: true  },
  { id: "haptics",       label: "Haptic feedback",       hint: "Light buzz when you cross thresholds (mobile)",     defaultOn: true  },
  { id: "reduced-motion", label: "Reduced motion",       hint: "Subtle animations only — for vestibular comfort",   defaultOn: false },
  { id: "auto-pdf",      label: "Auto-save PDF after session", hint: "Drops a copy in your downloads folder",       defaultOn: false },
  { id: "weekly-email",  label: "Weekly summary email",  hint: "Sundays at 7 PM. Plain text, one click to unsubscribe.", defaultOn: true },
];

type NotifPrefs = {
  quietStart: number; // 24-hour, 0-23
  quietEnd: number;   // 24-hour, 0-23
  tone: "whisper" | "default" | "coach";
  maxPerDay: 1 | 3 | 0; // 0 = unlimited
};

const DEFAULT_NOTIF: NotifPrefs = { quietStart: 21, quietEnd: 7, tone: "default", maxPerDay: 3 };

const TONE_PREVIEWS: Record<NotifPrefs["tone"], { label: string; sample: string }> = {
  whisper: { label: "Whisper", sample: "If today's a good time, your session is ready." },
  default: { label: "Default", sample: "Your evening focus session is ready when you are." },
  coach:   { label: "Coach",   sample: "You're 1 day from a 7-day streak. 12 minutes is all it takes." },
};

interface SettingsSheetProps {
  open: boolean;
  setOpen: (v: boolean) => void;
}

// Single opinionated settings screen. Five toggles + one notification panel.
// Per the research: 'Most settings exist because the team couldn't decide;
// pick the default.' We add the notification panel because the 2:47 a.m.
// 'you broke your streak' notification is the canonical 2025 horror story
// users want quiet hours, batching, and tone control over.
export function SettingsSheet({ open, setOpen }: SettingsSheetProps) {
  const [values, setValues] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    PREFS.forEach((p) => { initial[p.id] = p.defaultOn; });
    return initial;
  });
  const [notif, setNotif] = useState<NotifPrefs>(DEFAULT_NOTIF);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const next: Record<string, boolean> = {};
      PREFS.forEach((p) => {
        const v = localStorage.getItem(STORAGE_PREFIX + p.id);
        next[p.id] = v == null ? p.defaultOn : v === "1";
      });
      setValues(next);
      const n = localStorage.getItem(NOTIF_KEY);
      if (n) {
        const parsed = JSON.parse(n);
        if (parsed && typeof parsed === "object") setNotif({ ...DEFAULT_NOTIF, ...parsed });
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => dialogRef.current?.focus(), 10);
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (open && e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  function toggle(id: string) {
    const next = { ...values, [id]: !values[id] };
    setValues(next);
    try { localStorage.setItem(STORAGE_PREFIX + id, next[id] ? "1" : "0"); } catch {}
  }
  function persistNotif(next: NotifPrefs) {
    setNotif(next);
    try { localStorage.setItem(NOTIF_KEY, JSON.stringify(next)); } catch {}
  }
  function fmtHour(h: number) {
    const hour = ((h + 11) % 12) + 1;
    const ampm = h < 12 ? "AM" : "PM";
    return `${hour} ${ampm}`;
  }

  if (!open) return null;

  const tonePreview = TONE_PREVIEWS[notif.tone];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
      onClick={() => setOpen(false)}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 outline-none max-h-[85vh] flex flex-col"
      >
        <div className="px-6 pt-6 pb-2 flex-shrink-0">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Settings</p>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-1">Just the essentials</h2>
          <p className="text-sm text-gray-500 leading-relaxed">We picked the defaults so you don&rsquo;t have to.</p>
        </div>

        <div className="overflow-y-auto flex-1 px-6 pb-3">
          {/* ── How we send reminders ── */}
          <section className="py-3">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">How we send reminders</p>

            {/* Tone */}
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1.5">Tone</label>
              <div className="flex gap-1.5">
                {(Object.keys(TONE_PREVIEWS) as NotifPrefs["tone"][]).map((t) => {
                  const active = notif.tone === t;
                  return (
                    <button
                      key={t}
                      onClick={() => persistNotif({ ...notif, tone: t })}
                      className={`flex-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        active ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300"
                      }`}
                      aria-pressed={active}
                    >
                      {TONE_PREVIEWS[t].label}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                <p className="text-[10px] text-gray-400 mb-1">EEGBase · just now</p>
                <p className="text-sm text-gray-800 leading-snug">&ldquo;{tonePreview.sample}&rdquo;</p>
              </div>
            </div>

            {/* Quiet hours */}
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1.5">Quiet hours <span className="tabular-nums">{fmtHour(notif.quietStart)} → {fmtHour(notif.quietEnd)}</span></label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={notif.quietStart}
                  onChange={(e) => persistNotif({ ...notif, quietStart: Number(e.target.value) })}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm tabular-nums focus:outline-none focus:border-blue-300"
                  aria-label="Quiet hours start"
                >
                  {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{fmtHour(h)}</option>)}
                </select>
                <select
                  value={notif.quietEnd}
                  onChange={(e) => persistNotif({ ...notif, quietEnd: Number(e.target.value) })}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm tabular-nums focus:outline-none focus:border-blue-300"
                  aria-label="Quiet hours end"
                >
                  {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{fmtHour(h)}</option>)}
                </select>
              </div>
            </div>

            {/* Max per day */}
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1.5">Max per day</label>
              <div className="flex gap-1.5">
                {([1, 3, 0] as NotifPrefs["maxPerDay"][]).map((n) => {
                  const active = notif.maxPerDay === n;
                  return (
                    <button
                      key={n}
                      onClick={() => persistNotif({ ...notif, maxPerDay: n })}
                      className={`flex-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors tabular-nums ${
                        active ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300"
                      }`}
                      aria-pressed={active}
                    >
                      {n === 0 ? "No cap" : n}
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="text-[11px] text-gray-400 leading-relaxed">
              Every reminder includes a &ldquo;why am I getting this?&rdquo; link.
            </p>
          </section>

          {/* ── App preferences (existing) ── */}
          <section className="border-t border-gray-100 pt-3">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">App</p>
            <ul className="divide-y divide-gray-100">
              {PREFS.map((p) => {
                const on = values[p.id] ?? p.defaultOn;
                return (
                  <li key={p.id} className="py-3 flex items-center gap-4">
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-gray-900">{p.label}</span>
                      <span className="block text-xs text-gray-500 mt-0.5 leading-relaxed">{p.hint}</span>
                    </span>
                    <button
                      onClick={() => toggle(p.id)}
                      role="switch"
                      aria-checked={on}
                      aria-label={`${p.label} ${on ? "on" : "off"}`}
                      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${on ? "bg-blue-600" : "bg-gray-300"}`}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${on ? "left-[22px]" : "left-0.5"}`}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Privacy & data — opens a separate sheet */}
          <section className="border-t border-gray-100 pt-3 mt-1">
            <button
              onClick={() => setPrivacyOpen(true)}
              className="w-full text-left flex items-center justify-between gap-3 px-3 py-3 -mx-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <span>
                <span className="block text-sm font-semibold text-gray-900">Privacy & data</span>
                <span className="block text-xs text-gray-500 mt-0.5 leading-relaxed">Per-purpose consent · access log · export · delete</span>
              </span>
              <span className="text-blue-600 text-sm font-semibold flex-shrink-0" aria-hidden>→</span>
            </button>
          </section>
        </div>

        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end flex-shrink-0">
          <button
            onClick={() => setOpen(false)}
            className="px-4 py-2 text-sm text-gray-700 font-semibold hover:text-gray-900"
          >
            Done
          </button>
        </div>
      </div>

      <PrivacySheet open={privacyOpen} setOpen={setPrivacyOpen} audience="home" />
    </div>
  );
}
