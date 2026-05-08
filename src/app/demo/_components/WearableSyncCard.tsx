"use client";

import { useEffect, useState } from "react";
import { DEVICES } from "../_data/devices";
import { WEARABLE_SYNC } from "../_data/wearable-sync";

const STORAGE_KEY = "eegbase-demo-paired";

// Reads paired devices from localStorage (same key DevicesCard writes) and
// renders a compact "Today's signals" card with the latest sync from any
// wearables/HR-straps that have data. Hides itself when nothing's paired.

export function WearableSyncCard() {
  // Mirror the localStorage state with safe defaults (initial-paired set).
  const [paired, setPaired] = useState<string[]>(() =>
    DEVICES.filter((d) => d.initial).map((d) => d.id)
  );

  useEffect(() => {
    function read() {
      try {
        const v = localStorage.getItem(STORAGE_KEY);
        if (v) {
          const list = JSON.parse(v);
          if (Array.isArray(list)) setPaired(list);
        }
      } catch {}
    }
    read();
    // Keep in sync if DevicesCard updates within the same tab via a custom event.
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) read();
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Only render rows for paired devices that have sync data (i.e. wearables
  // and HR straps — not headsets like Mendi/Muse/OpenBCI).
  const rows = paired
    .map((id) => WEARABLE_SYNC[id])
    .filter((r): r is NonNullable<typeof r> => r != null);

  if (rows.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Today&rsquo;s signals</h2>
        <p className="text-xs text-gray-400">From your wearables</p>
      </div>
      <ul className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden">
        {rows.map((r) => {
          const d = DEVICES.find((x) => x.id === r.deviceId);
          if (!d) return null;
          return (
            <li key={r.deviceId} className="px-5 py-4">
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-xs flex-shrink-0"
                  style={{ background: d.badgeBg, color: d.badgeFg }}
                  aria-hidden
                >
                  {d.badge}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-gray-900">{d.name}</span>
                </span>
                <span className="text-[11px] text-gray-400 tabular-nums">{r.syncedAgo}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pl-12">
                {r.metrics.map((m) => (
                  <div key={m.label}>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">{m.label}</p>
                    <p className="text-base font-bold text-gray-900 tabular-nums leading-tight">{m.value}</p>
                    {m.sub && <p className="text-[10px] text-gray-400 mt-0.5">{m.sub}</p>}
                  </div>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
