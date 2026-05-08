"use client";

import { useState } from "react";
import Link from "next/link";

interface ClientRow {
  id: string;
  name: string;
  email: string | null;
  goals: string | null;
  active: boolean;
  sessionCount: number;
  avgRewardScore: string | null;
  lastSessionAt: Date | null;
}

// Vertical list — same pattern as the demo PatientsView. No sortable table,
// no risk badges, no 9 columns, no filter pills. Search only when needed.
export function ClientList({ clients }: { clients: ClientRow[] }) {
  const [query, setQuery] = useState("");
  const showSearch = clients.length > 6;
  const filtered = query.trim()
    ? clients.filter((c) =>
        (c.name + " " + (c.email ?? "") + " " + (c.goals ?? "")).toLowerCase().includes(query.toLowerCase())
      )
    : clients;

  function initials(name: string) {
    return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  }
  function relativeDays(d: Date | null) {
    if (!d) return "Never";
    const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  }

  if (clients.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
        <p className="text-sm text-gray-500">No clients yet. Add your first client to get started.</p>
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
            placeholder="Search clients\u2026"
            className="w-full px-4 py-2.5 rounded-xl text-sm bg-white border border-gray-200 focus:outline-none focus:border-blue-400"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-500 px-1 py-3">No matches for &ldquo;{query}&rdquo;.</p>
      ) : (
        <ul className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden">
          {filtered.map((c) => (
            <li key={c.id}>
              <Link
                href={`/clients/${c.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <span className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm flex items-center justify-center flex-shrink-0">
                  {initials(c.name)}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-gray-900">{c.name}</span>
                  <span className="block text-xs text-gray-500 truncate">
                    {c.goals ? c.goals : c.email ?? "No notes yet"}
                  </span>
                </span>
                <span className="hidden sm:block text-xs text-gray-400 tabular-nums text-right">
                  <span className="block">{c.sessionCount} session{c.sessionCount !== 1 ? "s" : ""}</span>
                  <span className="block">{relativeDays(c.lastSessionAt)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {(query && filtered.length > 0) && (
        <p className="text-xs text-gray-400 mt-3 text-right">
          {filtered.length} of {clients.length}
        </p>
      )}
    </div>
  );
}
