"use client";
import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

interface ClientRow {
  id: string;
  name: string;
  email: string | null;
  goals: string | null;
  active: boolean;
  createdAt: Date;
  sessionCount: number;
  avgRewardScore: string | null;
}

type StatusFilter = "active" | "all" | "inactive";

export function ClientsTable({ clients }: { clients: ClientRow[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");

  const statusFiltered =
    statusFilter === "all"
      ? clients
      : clients.filter((c) => (statusFilter === "active" ? c.active : !c.active));

  const filtered = query.trim()
    ? statusFiltered.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          (c.email ?? "").toLowerCase().includes(query.toLowerCase()) ||
          (c.goals ?? "").toLowerCase().includes(query.toLowerCase())
      )
    : statusFiltered;

  const activeCount = clients.filter((c) => c.active).length;
  const inactiveCount = clients.filter((c) => !c.active).length;

  return (
    <div>
      {/* Status filter tabs + search */}
      {clients.length > 0 && (
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 text-sm">
            {(
              [
                ["active", "Active", activeCount],
                ["all", "All", clients.length],
                ["inactive", "Inactive", inactiveCount],
              ] as [StatusFilter, string, number][]
            ).map(([value, label, count]) => (
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
                  {count}
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
              <th className="text-left px-5 py-3 font-medium text-gray-500">Name</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Goals</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Sessions</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Avg Reward</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Email</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Added</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                  {query ? `No clients match "${query}".` : "No clients yet. Click \"Add Client\" to get started."}
                </td>
              </tr>
            ) : (
              filtered.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
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
                      {client.sessionCount} session{client.sessionCount !== 1 ? "s" : ""}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {client.avgRewardScore != null ? (
                      <span className={`text-sm font-semibold ${
                        Number(client.avgRewardScore) >= 70 ? "text-emerald-600"
                        : Number(client.avgRewardScore) >= 40 ? "text-amber-600"
                        : "text-red-500"
                      }`}>
                        {Number(client.avgRewardScore).toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {(query || statusFilter !== "all") && filtered.length > 0 && (
        <p className="text-xs text-gray-400 mt-2 text-right">
          {filtered.length} of {clients.length} client{clients.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
