"use client";

import { useState } from "react";
import Link from "next/link";

interface SessionRow {
  id: string;
  startedAt: Date;
  durationSeconds: number | null;
  avgRewardScore: number | null;
  clientName: string;
  clientId: string;
  protocolName: string | null;
}

// Vertical list — matches PatientsView. No table, no 6 filters, no multi-select,
// no bulk-tag bar, no sortable headers, no per-row sparklines. Search only.
export function SessionList({ sessions }: { sessions: SessionRow[] }) {
  const [query, setQuery] = useState("");
  const showSearch = sessions.length > 8;
  const filtered = query.trim()
    ? sessions.filter((s) =>
        (s.clientName + " " + (s.protocolName ?? "")).toLowerCase().includes(query.toLowerCase())
      )
    : sessions;

  function fmtDate(d: Date) {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  function fmtMin(sec: number | null) {
    if (sec == null) return "\u2014";
    return `${Math.round(sec / 60)} min`;
  }
  function scoreColor(score: number | null) {
    if (score == null) return "#94A3B8";
    if (score >= 70) return "#10B981";
    if (score >= 40) return "#F59E0B";
    return "#EF4444";
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
        <p className="text-sm text-gray-500 mb-4">No sessions yet.</p>
        <Link
          href="/sessions/live"
          className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold"
        >
          Start your first session →
        </Link>
      </div>
    );
  }

  return (
    <div>
      {showSearch && (
        <div className="mb-4">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by client or protocol\u2026"
            className="w-full px-4 py-2.5 rounded-xl text-sm bg-white border border-gray-200 focus:outline-none focus:border-blue-400"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-500 px-1 py-3">No matches for &ldquo;{query}&rdquo;.</p>
      ) : (
        <ul className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden">
          {filtered.map((s) => (
            <li key={s.id}>
              <Link
                href={`/sessions/${s.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <span className="text-xs text-gray-500 tabular-nums w-16 flex-shrink-0">{fmtDate(s.startedAt)}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-gray-900 truncate">{s.clientName}</span>
                  {s.protocolName && (
                    <span className="block text-xs text-gray-500 truncate">{s.protocolName}</span>
                  )}
                </span>
                <span className="text-right flex-shrink-0">
                  <span
                    className="block text-base font-bold tabular-nums"
                    style={{ color: scoreColor(s.avgRewardScore) }}
                  >
                    {s.avgRewardScore != null ? Math.round(s.avgRewardScore) : "\u2014"}
                  </span>
                  <span className="block text-[10px] text-gray-400">focus</span>
                </span>
                <span className="hidden sm:block text-xs text-gray-400 tabular-nums w-16 text-right flex-shrink-0">
                  {fmtMin(s.durationSeconds)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {(query && filtered.length > 0) && (
        <p className="text-xs text-gray-400 mt-3 text-right">
          {filtered.length} of {sessions.length}
        </p>
      )}
    </div>
  );
}
