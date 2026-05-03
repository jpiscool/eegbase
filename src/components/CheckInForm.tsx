"use client";
import { useState } from "react";
import { logCheckIn } from "@/app/clients/checkin-actions";

const SCALES: { key: string; label: string; desc: string; invert?: boolean }[] = [
  { key: "sleepQuality", label: "Sleep Quality", desc: "1 = poor · 10 = excellent" },
  { key: "mood", label: "Mood", desc: "1 = very low · 10 = excellent" },
  { key: "anxiety", label: "Anxiety", desc: "1 = very calm · 10 = very anxious", invert: true },
  { key: "focus", label: "Focus", desc: "1 = very scattered · 10 = sharp" },
  { key: "energy", label: "Energy", desc: "1 = exhausted · 10 = very energised" },
];

export function CheckInForm({ clientId }: { clientId: string }) {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [values, setValues] = useState<Record<string, number>>({
    sleepQuality: 5, mood: 5, anxiety: 5, focus: 5, energy: 5,
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    try {
      await logCheckIn(new FormData(e.currentTarget));
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-sm font-semibold text-gray-900 mb-1">Log Today&apos;s Check-In</h2>
      <p className="text-xs text-gray-500 mb-5">Record how the client is doing today.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="hidden" name="clientId" value={clientId} />

        {/* Sleep hours */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Sleep (hours)
          </label>
          <input
            name="sleepHours"
            type="number"
            min={0}
            max={24}
            step={0.5}
            defaultValue={7}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Scale inputs */}
        {SCALES.map(({ key, label, desc }) => (
          <div key={key}>
            <div className="flex items-baseline justify-between mb-1">
              <label className="text-xs font-medium text-gray-700">{label}</label>
              <span className="text-[11px] text-gray-400">{desc}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-3 text-right">1</span>
              <input
                name={key}
                type="range"
                min={1}
                max={10}
                value={values[key]}
                onChange={(e) => setValues((v) => ({ ...v, [key]: Number(e.target.value) }))}
                className="flex-1 accent-blue-600"
              />
              <span className="text-xs text-gray-400 w-3">10</span>
              <span className="w-7 text-center text-sm font-bold text-blue-600 tabular-nums">
                {values[key]}
              </span>
            </div>
          </div>
        ))}

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Notes <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            name="notes"
            rows={2}
            placeholder="Any observations…"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {done ? "✓ Saved!" : pending ? "Saving…" : "Log Check-In"}
        </button>
      </form>
    </div>
  );
}
