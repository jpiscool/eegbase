"use client";
import { useState } from "react";
import Link from "next/link";
import { Search, ChevronUp, ChevronDown } from "lucide-react";

interface ClientRow {
  id: string;
  name: string;
  email: string | null;
  goals: string | null;
  active: boolean;
  createdAt: Date;
  sessionCount: number;
  avgRewardScore: string | null;
  lastSessionAt: Date | null;
  trend?: "up" | "down" | "flat" | null;
}

type StatusFilter = "active" | "all" | "inactive";
type SortKey = "name" | "sessionCount" | "avgRewardScore" | "lastSessionAt" | "createdAt";
type SortDir = "asc" | "desc";

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronUp size={12} className="ml-1 text-gray-300" />;
  return sortDir === "asc"
    ? <ChevronUp size={12} className="ml-1 text-blue-500" />
    : <ChevronDown size={12} className="ml-1 text-blue-500" />;
}

export function ClientsTable({ clients }: { clients: ClientRow[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [sortKey, setSortKey] = useState<SortKey>("lastSessionAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const statusFiltered =
    statusFilter === "all"
      ? clients
      : clients.filter((c) => (statusFilter === "active" ? c.active : !c.active));

  const searched = query.trim()
    ? statusFiltered.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          (c.email ?? "").toLowerCase().includes(query.toLowerCase()) ||
          (c.goals ?? "").toLowerCase().includes(query.toLowerCase())
      )
    : statusFiltered;

  const sorted = [...searched].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "name") {
      cmp = a.name.localeCompare(b.name);
    } else if (sortKey === "sessionCount") {
      cmp = a.sessionCount - b.sessionCount;
    } else if (sortKey === "avgRewardScore") {
      cmp = (Number(a.avgRewardScore) || 0) - (Number(b.avgRewardScore) || 0);
    } else if (sortKey === "lastSessionAt") {
      const ta = a.lastSessionAt ? new Date(a.lastSessionAt).getTime() : 0;
      const tb = b.lastSessionAt ? new Date(b.lastSessionAt).getTime() : 0;
      cmp = ta - tb;
    } else if (sortKey === "createdAt") {
      cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const activeCount = clients.filter((c) => c.active).length;
  const inactiveCount = clients.filter((c) => !c.active).length;

  function Th({ label, col }: { label: string; col: SortKey }) {
    return (
      <th
        className="text-left px-5 py-3 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700 whitespace-nowrap"
        onClick={() => toggleSort(col)}
      >
        <span className="inline-flex items-center">
          {label}
          <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
        </span>
      </th>
    );
  }

  return (
    <div>
      {clients.length > 0 && (
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 text-sm">
            {(
              [
                ["active", "Active", activeCount],
                ["all", "All", clients.length],
                ["inactive", "Inactive", inactiveCount],
              ] as [StatusFilter, string, number][]
            ).map(([value, label, cnt]) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  statusFilter === value
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
                <span
                  className={`ml-1.5 text-xs ${
                    statusFilter === value ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  {cnt}
                </span>
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, or goals…"
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <Th label="Name" col="name" />
              <th className="text-left px-5 py-3 font-medium text-gray-500">Goals</th>
              <Th label="Sessions" col="sessionCount" />
              <Th label="Avg Reward" col="avgRewardScore" />
              <Th label="Last Session" col="lastSessionAt" />
              <th className="text-left px-5 py-3 font-medium text-gray-500">Email</th>
              <Th label="Added" col="createdAt" />
              <th className="text-left px-5 py-3 font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-gray-400">
                  {query
                    ? `No clients match "${query}".`
                    : 'No clients yet. Click "Add Client" to get started.'}
                </td>
              </tr>
            ) : (
              sorted.map((client) => {
                const lastSessionDays = client.lastSessionAt
                  ? Math.floor(
                      (Date.now() - new Date(client.lastSessionAt).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  : null;
                return (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900">
                      <Link href={`/clients/${client.id}`} className="hover:text-blue-600 transition-colors">
                        {client.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 max-w-xs">
                      {client.goals ? (
                        <span className="truncate block text-sm text-gray-600">{client.goals}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        {client.sessionCount}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {client.avgRewardScore != null ? (
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-semibold ${
                              Number(client.avgRewardScore) >= 70
                                ? "text-emerald-600"
                                : Number(client.avgRewardScore) >= 40
                                ? "text-amber-600"
                                : "text-red-500"
                            }`}
                          >
                            {Number(client.avgRewardScore).toFixed(1)}
                          </span>
                          {client.trend === "up" && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600" title="Improving">
                              <ChevronUp size={10} />↑
                            </span>
                          )}
                          {client.trend === "down" && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-500" title="Declining">
                              <ChevronDown size={10} />↓
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {lastSessionDays === null ? (
                        <span className="text-gray-300">Never</span>
                      ) : lastSessionDays === 0 ? (
                        <span className="text-emerald-600 font-medium">Today</span>
                      ) : lastSessionDays <= 7 ? (
                        <span className="text-emerald-600">{lastSessionDays}d ago</span>
                      ) : lastSessionDays <= 21 ? (
                        <span className="text-amber-600">{lastSessionDays}d ago</span>
                      ) : (
                        <span className="text-red-500">{lastSessionDays}d ago</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{client.email ?? "—"}</td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {new Date(client.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          client.active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {client.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {(query || statusFilter !== "all") && sorted.length > 0 && (
        <p className="text-xs text-gray-400 mt-2 text-right">
          {sorted.length} of {clients.length} client{clients.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
