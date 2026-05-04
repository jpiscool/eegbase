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
type SortKey = "name" | "sessionCount" | "avgRewardScore" | "lastSessionAt" | "createdAt" | "risk";
type SortDir = "asc" | "desc";

function computeRisk(client: ClientRow): { score: number; label: string; color: string; bg: string } {
  const days = client.lastSessionAt
    ? Math.floor((Date.now() - new Date(client.lastSessionAt).getTime()) / (86400000))
    : null;
  let pts = 0;
  if (days === null || days > 60) pts += 3;
  else if (days > 21) pts += 2;
  else if (days > 7) pts += 1;
  if (client.sessionCount < 5) pts += 3;
  else if (client.sessionCount < 10) pts += 2;
  else if (client.sessionCount < 15) pts += 1;
  if (client.trend === "down") pts += 1;
  if (pts <= 1) return { score: pts, label: "Low", color: "var(--success)", bg: "var(--success-subtle)" };
  if (pts <= 3) return { score: pts, label: "Med", color: "var(--warning)", bg: "var(--warning-subtle)" };
  return { score: pts, label: "High", color: "var(--danger)", bg: "var(--danger-subtle)" };
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronUp size={12} className="ml-1" style={{ color: "var(--border-default)" }} />;
  return sortDir === "asc"
    ? <ChevronUp size={12} className="ml-1" style={{ color: "var(--brand)" }} />
    : <ChevronDown size={12} className="ml-1" style={{ color: "var(--brand)" }} />;
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
    } else if (sortKey === "risk") {
      cmp = computeRisk(a).score - computeRisk(b).score;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const activeCount = clients.filter((c) => c.active).length;
  const inactiveCount = clients.filter((c) => !c.active).length;

  function Th({ label, col }: { label: string; col: SortKey }) {
    return (
      <th
        className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none whitespace-nowrap"
        style={{ color: "var(--text-tertiary)" }}
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
          <div className="flex items-center rounded-lg p-0.5 text-sm" style={{ background: "var(--surface-sunken)" }}>
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
                className="px-3 py-1.5 rounded-md font-medium transition-colors text-sm"
                style={statusFilter === value
                  ? { background: "var(--surface-raised)", color: "var(--text-primary)", boxShadow: "var(--shadow-card)" }
                  : { color: "var(--text-tertiary)" }}
              >
                {label}
                <span className="ml-1.5 text-xs" style={{ color: "var(--text-tertiary)" }}>{cnt}</span>
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-tertiary)" }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, or goals…"
              className="w-full pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none"
              style={{ background: "var(--surface-raised)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
            />
          </div>
        </div>
      )}

      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
        <table className="w-full text-sm">
          <thead className="border-b" style={{ background: "var(--surface-sunken)", borderColor: "var(--border-subtle)" }}>
            <tr>
              <Th label="Name" col="name" />
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Goals</th>
              <Th label="Sessions" col="sessionCount" />
              <Th label="Avg Reward" col="avgRewardScore" />
              <Th label="Last Session" col="lastSessionAt" />
              <Th label="Risk" col="risk" />
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Email</th>
              <Th label="Added" col="createdAt" />
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-5 py-12 text-center" style={{ color: "var(--text-tertiary)" }}>
                  {query
                    ? `No clients match "${query}".`
                    : 'No clients yet. Click "Add Client" to get started.'}
                </td>
              </tr>
            ) : (
              sorted.map((client) => {
                const lastSessionDays = client.lastSessionAt
                  ? Math.floor((Date.now() - new Date(client.lastSessionAt).getTime()) / (1000 * 60 * 60 * 24))
                  : null;
                return (
                  <tr key={client.id} className="transition-colors">
                    <td className="px-5 py-3.5 font-medium">
                      <Link href={`/clients/${client.id}`} className="hover:underline transition-colors" style={{ color: "var(--text-primary)" }}>
                        {client.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 max-w-xs">
                      {client.goals ? (
                        <span className="truncate block text-sm" style={{ color: "var(--text-secondary)" }}>{client.goals}</span>
                      ) : (
                        <span style={{ color: "var(--text-tertiary)" }}>—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "var(--surface-sunken)", color: "var(--text-secondary)" }}>
                        {client.sessionCount}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {client.avgRewardScore != null ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold" style={{
                            color: Number(client.avgRewardScore) >= 70 ? "var(--success)"
                              : Number(client.avgRewardScore) >= 40 ? "var(--warning)"
                              : "var(--danger)"
                          }}>
                            {Number(client.avgRewardScore).toFixed(1)}
                          </span>
                          {client.trend === "up" && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: "var(--success-subtle)", color: "var(--success)" }} title="Improving">
                              ↑
                            </span>
                          )}
                          {client.trend === "down" && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: "var(--danger-subtle)", color: "var(--danger)" }} title="Declining">
                              ↓
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-tertiary)" }}>—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {lastSessionDays === null ? (
                        <span style={{ color: "var(--text-tertiary)" }}>Never</span>
                      ) : lastSessionDays === 0 ? (
                        <span className="font-medium" style={{ color: "var(--success)" }}>Today</span>
                      ) : lastSessionDays <= 7 ? (
                        <span style={{ color: "var(--success)" }}>{lastSessionDays}d ago</span>
                      ) : lastSessionDays <= 21 ? (
                        <span style={{ color: "var(--warning)" }}>{lastSessionDays}d ago</span>
                      ) : (
                        <span style={{ color: "var(--danger)" }}>{lastSessionDays}d ago</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {client.active ? (
                        (() => {
                          const risk = computeRisk(client);
                          return (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{ background: risk.bg, color: risk.color }}
                              title={`Retention risk score: ${risk.score}`}>
                              {risk.label}
                            </span>
                          );
                        })()
                      ) : <span style={{ color: "var(--text-tertiary)" }}>—</span>}
                    </td>
                    <td className="px-5 py-3.5" style={{ color: "var(--text-secondary)" }}>{client.email ?? "—"}</td>
                    <td className="px-5 py-3.5" style={{ color: "var(--text-secondary)" }}>
                      {new Date(client.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={client.active
                          ? { background: "var(--success-subtle)", color: "var(--success)" }
                          : { background: "var(--surface-sunken)", color: "var(--text-tertiary)" }}>
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
        <p className="text-xs mt-2 text-right" style={{ color: "var(--text-tertiary)" }}>
          {sorted.length} of {clients.length} client{clients.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
