"use client";

// Phase 35 — Mendi-specific protocol progression card. Sits on the
// patient detail (clinician) and on the home Today (home user). Shows
// where this patient is in Mendi's recommended 12-week training arc,
// with the next protocol pre-selected.
//
// This is the most Mendi-aligned single piece of UX in the demo: it
// doesn't reinvent the protocol, it amplifies Mendi's own framework.
// Should be the first thing Mustafa points to in the call.

const MENDI_PROGRAM = [
  { weeks: "1-2",  label: "Baseline & calibration",       focus: "Get a clean signal. Train every other day, 8 minutes." },
  { weeks: "3-4",  label: "Consistent attention",         focus: "Daily 10-minute sessions. Score variability matters more than peak." },
  { weeks: "5-6",  label: "Sustained focus",              focus: "12-minute sessions. Aim for steady state, not spikes." },
  { weeks: "7-8",  label: "Real-world transfer",          focus: "Pre-meeting and pre-task sessions. Notice carryover." },
  { weeks: "9-10", label: "Advanced regulation",          focus: "15-minute sessions. Combine with sleep and HRV signals." },
  { weeks: "11-12", label: "Maintenance + reassessment",  focus: "3 sessions per week. Re-baseline against week 1." },
];

interface MendiProgressionCardProps {
  currentWeek?: number;          // 1-12
  audience: "clinician" | "home";
  patientFirstName?: string;
}

export function MendiProgressionCard({ currentWeek = 4, audience, patientFirstName = "Sarah" }: MendiProgressionCardProps) {
  const idx = MENDI_PROGRAM.findIndex((p) => {
    const [a, b] = p.weeks.split("-").map(Number);
    return currentWeek >= a && currentWeek <= b;
  });
  const current = MENDI_PROGRAM[idx] ?? MENDI_PROGRAM[0];
  const next = MENDI_PROGRAM[idx + 1] ?? null;

  const subject = audience === "home" ? "You're" : `${patientFirstName} is`;

  return (
    <section className="mb-12">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mendi program · week {currentWeek} of 12</h2>
        <p className="text-xs text-gray-400">Mendi&rsquo;s recommended progression</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        {/* Step bar */}
        <div className="flex items-center gap-1 mb-4" aria-hidden>
          {MENDI_PROGRAM.map((p, i) => (
            <div
              key={p.weeks}
              className={`flex-1 h-1.5 rounded-full ${
                i < idx ? "bg-blue-600" : i === idx ? "bg-blue-600/60" : "bg-gray-100"
              }`}
            />
          ))}
        </div>

        <p className="text-base text-gray-800 leading-relaxed mb-2">
          <span className="font-semibold text-gray-900">{subject}</span> in{" "}
          <span className="font-semibold text-gray-900">{current.label}</span> right now (weeks {current.weeks}).
        </p>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">{current.focus}</p>

        {next && (
          <div className="border-t border-gray-100 pt-3">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Next phase</p>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">{next.label}</span> · weeks {next.weeks}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{next.focus}</p>
          </div>
        )}
      </div>
    </section>
  );
}
