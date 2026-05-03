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
}

export function ClientsTable({ clients }: { clients: ClientRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          (c.email ?? "").toLowerCase().includes(query.toLowerCase()) ||
          (c.goals ?? "").toLowerCase().includes(query.toLowerCase())
      )
    : clients;

  return (
    <div>
      {/* Search bar */}
      {clients.length > 0 && (
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients by name, email, or goals…"
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Name</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Goals</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Sessions</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Email</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Added</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
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

      {query && filtered.length > 0 && (
        <p className="text-xs text-gray-400 mt-2 text-right">
          {filtered.length} of {clients.length} client{clients.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
