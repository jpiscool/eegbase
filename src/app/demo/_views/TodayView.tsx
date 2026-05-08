"use client";

import { TODAY_SCHEDULE, SPARKLINES } from "../_data/sessions";
import { Sparkline } from "../_components/Sparkline";

interface TodayViewProps {
  onStartSession: (clientId: string) => void;
  onOpenPatient: (clientId: string) => void;
}

export function TodayView({ onStartSession, onOpenPatient }: TodayViewProps) {
  const next = TODAY_SCHEDULE.find((a) => a.status === "Now") ?? TODAY_SCHEDULE.find((a) => a.status === "Upcoming");
  const stats = [
    { label: "Sessions this week", value: 12, sub: "↗ up 2 vs last week", series: SPARKLINES.sessionsThisWeek },
    { label: "Avg session length", value: 28, sub: "minutes",             series: SPARKLINES.avgSessionMin, suffix: " min" },
    { label: "Reports pending",    value: 1,  sub: "Sarah Mitchell",       series: SPARKLINES.reportsPending },
  ];

  return (
    <main id="main-content" className="max-w-2xl mx-auto px-6 py-12">
      {/* 1 — One primary action above the fold */}
      {next && (
        <section className="mb-12">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Next up</p>
          <button
            onClick={() => onStartSession(next.clientId)}
            className="w-full text-left bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-7 transition-colors shadow-sm"
          >
            <p className="text-blue-100 text-sm font-medium mb-1">{next.time} · {next.clientName}</p>
            <p className="text-2xl md:text-3xl font-bold tracking-tight">
              Start session <span aria-hidden>→</span>
            </p>
          </button>
        </section>
      )}

      {/* 2 — Today's schedule */}
      <section className="mb-12">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Today</h2>
        <ul className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden">
          {TODAY_SCHEDULE.map((a) => {
            const pillClass =
              a.status === "Done" ? "bg-gray-100 text-gray-500" :
              a.status === "Now"  ? "bg-emerald-100 text-emerald-700" :
                                    "bg-blue-50 text-blue-700";
            return (
              <li key={a.time + a.clientId}>
                <button
                  onClick={() => onOpenPatient(a.clientId)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-gray-900 tabular-nums w-20">{a.time}</span>
                    <span className="text-sm text-gray-700">{a.clientName}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${pillClass}`}>{a.status}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 3 — Stat row with sparklines */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">This week</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-xs text-gray-500 mb-1.5">{s.label}</p>
              <div className="flex items-end justify-between gap-3">
                <p className="text-2xl font-bold text-gray-900 tabular-nums">
                  {s.value}{s.suffix ?? ""}
                </p>
                <Sparkline data={s.series} />
              </div>
              <p className="text-xs text-gray-500 mt-2">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
