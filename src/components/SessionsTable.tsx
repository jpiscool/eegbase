"use client";
import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

type DeviceFilter = "all" | "mendi" | "simulator";
type ProtocolFilter = "all" | string;

interface SessionRow {
  id: string;
  startedAt: Date;
  durationSeconds: number | null;
  avgRewardScore: number | null;
  deviceType: string;
  clientName: string;
  clientId: string;
  protocolName: string | null;
  preFocus: number | null;
  postFocus: number | null;
}

function fmtDuration(sec: number | null) {
  if (sec == null) return "—";
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

export function SessionsTable({ sessions }: { sessions: SessionRow[] }) {
  const [query, setQuery] = useState("");
  const [deviceFilter, setDeviceFilter] = useState<DeviceFilter>("all");
  const [protocolFilter, setProtocolFilter] = useState<ProtocolFilter>("all");

  // Unique device types present
  const deviceTypes = Array.from(new Set(sessions.map((s) => s.deviceType))).sort();
  // Unique protocol names present (excluding null)
  const protocolNames = Array.from(
    new Set(sessions.map((s) => s.protocolName).filter((p): p is string => p != null))
  ).sort();

  const deviceFiltered =
    deviceFilter === "all"
      ? sessions
      : sessions.filter((s) => s.deviceType === deviceFilter);

  const protocolFiltered =
    protocolFilter === "all"
      ? deviceFiltered
      : deviceFiltered.filter((s) => s.protocolName === protocolFilter);

  const filtered = query.trim()
    ? protocolFiltered.filter(
        (s) =>
          s.clientName.toLowerCase().includes(query.toLowerCase()) ||
          (s.protocolName ?? "").toLowerCase().includes(query.toLowerCase())
      )
    : protocolFiltered;

  const mendiCount = sessions.filter((s) => s.deviceType === "mendi").length;
  const simCount = sessions.filter((s) => s.deviceType === "simulator").length;

  return (
    <div>
      {sessions.length > 0 && (
        <div className="flex items-center gap-3 mb-4">
          {/* Device filter tabs */}
          {deviceTypes.length > 1 && (
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {([
                { key: "all", label: `All (${sessions.length})` },
                ...(mendiCount > 0 ? [{ key: "mendi", label: `Mendi (${mendiCount})` }] : []),
                ...(simCount > 0 ? [{ key: "simulator", label: `Sim (${simCount})` }] : []),
              ] as Array<{ key: DeviceFilter; label: string }>).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setDeviceFilter(key)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    deviceFilter === key
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {protocolNames.length > 1 && (
            <select
              value={protocolFilter}
              onChange={(e) => setProtocolFilter(e.target.value)}
              className="pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All protocols</option>
              {protocolNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          )}

          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by client or protocol…"
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Client</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Protocol</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Date</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Duration</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Avg Reward</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Focus Δ</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                  {query
                    ? `No sessions match "${query}".`
                    : <>No sessions recorded yet.{" "}<Link href="/sessions/live" className="text-blue-600 hover:underline">Start a live session</Link> to begin.</>}
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/clients/${s.clientId}`}
                      className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {s.clientName}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">
                    {s.protocolName ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">
                    {new Date(s.startedAt).toLocaleDateString()}{" "}
                    <span className="text-gray-400 text-xs">
                      {new Date(s.startedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{fmtDuration(s.durationSeconds)}</td>
                  <td className="px-5 py-3.5">
                    {s.avgRewardScore != null ? (
                      <span
                        className={`font-semibold ${
                          s.avgRewardScore >= 70
                            ? "text-emerald-600"
                            : s.avgRewardScore >= 40
                            ? "text-amber-600"
                            : "text-red-500"
                        }`}
                      >
                        {s.avgRewardScore.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">
                    {s.preFocus != null && s.postFocus != null ? (
                      <span>
                        {s.preFocus} →{" "}
                        <span
                          className={
                            s.postFocus > s.preFocus
                              ? "text-emerald-600 font-medium"
                              : s.postFocus < s.preFocus
                              ? "text-red-500 font-medium"
                              : "text-gray-500"
                          }
                        >
                          {s.postFocus}
                        </span>
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/sessions/${s.id}`} className="text-xs text-blue-600 hover:underline font-medium">
                      View →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {(query || deviceFilter !== "all" || protocolFilter !== "all") && filtered.length > 0 && (
        <p className="text-xs text-gray-400 mt-2 text-right">
          {filtered.length} of {sessions.length} session{sessions.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
