"use client";

import { useState, useEffect } from "react";
import { DEVICES, type Device } from "../_data/devices";

const STORAGE_KEY = "eegbase-demo-paired";

// Connected-devices summary card with a "+ Pair" affordance. The pairing
// modal is opinionated: pick a device → see a short loading state → paired.
// Demo state persists in localStorage so it survives page reloads.

export function DevicesCard() {
  const [paired, setPaired] = useState<string[]>(() => DEVICES.filter((d) => d.initial).map((d) => d.id));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pairing, setPairing] = useState<Device | null>(null);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v) {
        const list = JSON.parse(v);
        if (Array.isArray(list) && list.every((x) => typeof x === "string")) setPaired(list);
      }
    } catch {}
  }, []);

  function persist(next: string[]) {
    setPaired(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }

  function pair(d: Device) {
    setPairing(d);
    setTimeout(() => {
      persist(Array.from(new Set([...paired, d.id])));
      setPairing(null);
      setPickerOpen(false);
    }, 1200);
  }
  function unpair(id: string) {
    persist(paired.filter((x) => x !== id));
  }

  const connected = DEVICES.filter((d) => paired.includes(d.id));
  const available = DEVICES.filter((d) => !paired.includes(d.id));

  return (
    <section className="mb-12">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Connected devices</h2>
        <button
          onClick={() => setPickerOpen(true)}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800"
          disabled={available.length === 0}
        >
          {available.length === 0 ? "All paired" : "+ Pair a device"}
        </button>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        {connected.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No devices yet. Tap <em>+ Pair a device</em> above.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {connected.map((d) => (
              <li key={d.id} className="flex items-center gap-3">
                <span
                  className="w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-xs flex-shrink-0"
                  style={{ background: d.badgeBg, color: d.badgeFg }}
                  aria-hidden
                >
                  {d.badge}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-gray-900">{d.name}</span>
                  <span className="block text-xs text-gray-500 truncate">{d.what}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full font-medium" aria-label="Connected">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden />
                  on
                </span>
                <button
                  onClick={() => unpair(d.id)}
                  className="text-[11px] text-gray-400 hover:text-gray-700 px-1"
                  aria-label={`Unpair ${d.name}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pair picker modal */}
      {pickerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pair a device"
          onClick={() => !pairing && setPickerOpen(false)}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
          >
            <div className="px-6 pt-6 pb-2">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Pair a device</p>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-1">
                {pairing ? `Connecting to ${pairing.name}\u2026` : "Pick a device"}
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                {pairing
                  ? "Hold the device close. This usually takes a few seconds."
                  : "Any of these. EEGBase plugs into the headset, wearable, or strap you already use."}
              </p>
            </div>
            <div className="px-6 py-4">
              {pairing ? (
                <div className="flex items-center justify-center py-10">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-semibold text-base"
                      style={{ background: pairing.badgeBg, color: pairing.badgeFg }}
                    >
                      {pairing.badge}
                    </span>
                    <span className="inline-block w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" aria-hidden />
                  </div>
                </div>
              ) : (
                <ul className="space-y-1.5 max-h-72 overflow-y-auto">
                  {available.map((d) => (
                    <li key={d.id}>
                      <button
                        onClick={() => pair(d)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        <span
                          className="w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-xs flex-shrink-0"
                          style={{ background: d.badgeBg, color: d.badgeFg }}
                          aria-hidden
                        >
                          {d.badge}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-semibold text-gray-900">{d.name}</span>
                          <span className="block text-xs text-gray-500 truncate">{d.what}</span>
                        </span>
                        <span className="text-blue-600 text-sm font-medium" aria-hidden>Pair →</span>
                      </button>
                    </li>
                  ))}
                  {available.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-6">All supported devices are paired.</p>
                  )}
                </ul>
              )}
            </div>
            {!pairing && (
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-right">
                <button
                  onClick={() => setPickerOpen(false)}
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
