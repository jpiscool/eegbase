"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, X, Download, Tag, ChevronUp, ChevronDown, ChevronsUpDown, GitCompareArrows } from "lucide-react";

type SortCol = "date" | "duration" | "score" | "client" | "focusDelta";
type SortDir = "asc" | "desc";

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const W = 64, H = 24, pad = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v - min) / range) * (H - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const last = data[data.length - 1];
  const dotColor = last >= 70 ? "#059669" : last >= 40 ? "#D97706" : "#DC2626";
  const lineColor = last >= 70 ? "#10B981" : last >= 40 ? "#F59E0B" : "#EF4444";
  const [lx, ly] = pts[pts.length - 1].split(",").map(Number);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <polyline points={pts.join(" ")} fill="none" stroke={lineColor} strokeWidth={1.5}
        strokeLinejoin="round" strokeLinecap="round" opacity={0.7} />
      <circle cx={lx} cy={ly} r={2.5} fill={dotColor} />
    </svg>
  );
}

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
  tags?: string[] | null;
}

function fmtDuration(sec: number | null) {
  if (sec == null) return "—";
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

function csvRow(cells: string[]) {
  return cells.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",");
}

export function SessionsTable({
  sessions,
  sparklines = {},
}: {
  sessions: SessionRow[];
  sparklines?: Record<string, number[]>;
}) {
  const [query, setQuery] = useState("");
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [protocolFilter, setProtocolFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minScore, setMinScore] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [tagInput, setTagInput] = useState("");
  const [showTagBar, setShowTagBar] = useState(false);
  const [sortCol, setSortCol] = useState<SortCol>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const deviceTypes = useMemo(() => Array.from(new Set(sessions.map((s) => s.deviceType))).sort(), [sessions]);
  const protocolNames = useMemo(() => Array.from(
    new Set(sessions.map((s) => s.protocolName).filter((p): p is string => p != null))
  ).sort(), [sessions]);

  const filtered = useMemo(() => {
    let out = sessions;
    if (deviceFilter !== "all") out = out.filter((s) => s.deviceType === deviceFilter);
    if (protocolFilter !== "all") out = out.filter((s) => s.protocolName === protocolFilter);
    if (dateFrom) out = out.filter((s) => new Date(s.startedAt) >= new Date(dateFrom));
    if (dateTo) out = out.filter((s) => new Date(s.startedAt) <= new Date(dateTo + "T23:59:59"));
    if (minScore !== "") out = out.filter((s) => s.avgRewardScore != null && s.avgRewardScore >= Number(minScore));
    if (maxScore !== "") out = out.filter((s) => s.avgRewardScore != null && s.avgRewardScore <= Number(maxScore));
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter((s) =>
        s.clientName.toLowerCase().includes(q) ||
        (s.protocolName ?? "").toLowerCase().includes(q) ||
        (s.tags ?? []).some((t) => t.includes(q))
      );
    }
    return out;
  }, [sessions, deviceFilter, protocolFilter, dateFrom, dateTo, minScore, maxScore, query]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let diff = 0;
      if (sortCol === "date") diff = new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime();
      else if (sortCol === "duration") diff = (a.durationSeconds ?? 0) - (b.durationSeconds ?? 0);
      else if (sortCol === "score") diff = (a.avgRewardScore ?? -1) - (b.avgRewardScore ?? -1);
      else if (sortCol === "client") diff = a.clientName.localeCompare(b.clientName);
      else if (sortCol === "focusDelta") {
        const da = a.preFocus != null && a.postFocus != null ? a.postFocus - a.preFocus : -999;
        const db = b.preFocus != null && b.postFocus != null ? b.postFocus - b.preFocus : -999;
        diff = da - db;
      }
      return sortDir === "asc" ? diff : -diff;
    });
    return arr;
  }, [filtered, sortCol, sortDir]);

  function toggleSort(col: SortCol) {
    if (sortCol === col) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
  }

  function SortIcon({ col }: { col: SortCol }) {
    if (sortCol !== col) return <ChevronsUpDown size={12} style={{ color: "var(--text-tertiary)", opacity: 0.5 }} />;
    return sortDir === "asc"
      ? <ChevronUp size={12} style={{ color: "var(--brand)" }} />
      : <ChevronDown size={12} style={{ color: "var(--brand)" }} />;
  }

  const anyFilter = deviceFilter !== "all" || protocolFilter !== "all" || dateFrom || dateTo || minScore !== "" || maxScore !== "" || query.trim();

  function clearAll() {
    setDeviceFilter("all"); setProtocolFilter("all");
    setDateFrom(""); setDateTo(""); setMinScore(""); setMaxScore(""); setQuery("");
  }

  const allSelected = filtered.length > 0 && filtered.every((s) => selectedIds.has(s.id));

  function toggleAll() {
    if (allSelected) {
      setSelectedIds((prev) => { const n = new Set(prev); sorted.forEach((s) => n.delete(s.id)); return n; });
    } else {
      setSelectedIds((prev) => { const n = new Set(prev); sorted.forEach((s) => n.add(s.id)); return n; });
    }
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  const selectedRows = sessions.filter((s) => selectedIds.has(s.id));

  function exportSelected() {
    const header = csvRow(["id", "client", "protocol", "date", "duration_s", "avg_reward", "pre_focus", "post_focus", "tags"]);
    const rows = selectedRows.map((s) =>
      csvRow([
        s.id,
        s.clientName,
        s.protocolName ?? "",
        new Date(s.startedAt).toISOString(),
        String(s.durationSeconds ?? ""),
        String(s.avgRewardScore ?? ""),
        String(s.preFocus ?? ""),
        String(s.postFocus ?? ""),
        (s.tags ?? []).join("|"),
      ])
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "sessions-export.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      {sessions.length > 0 && (
        <>
          {/* ── Filter bar ─────────────────────────────────────────────────────── */}
          <div className="rounded-xl border p-4 mb-3" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
            <div className="flex flex-wrap items-end gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[180px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-tertiary)" }} />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search client, protocol, tag…"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ background: "var(--surface-sunken)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
                />
              </div>

              {/* Device */}
              {deviceTypes.length > 1 && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Device</label>
                  <select
                    value={deviceFilter}
                    onChange={(e) => setDeviceFilter(e.target.value)}
                    className="pl-3 pr-7 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ background: "var(--surface-sunken)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
                  >
                    <option value="all">All devices</option>
                    {deviceTypes.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}

              {/* Protocol */}
              {protocolNames.length > 0 && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Protocol</label>
                  <select
                    value={protocolFilter}
                    onChange={(e) => setProtocolFilter(e.target.value)}
                    className="pl-3 pr-7 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ background: "var(--surface-sunken)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
                  >
                    <option value="all">All protocols</option>
                    {protocolNames.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              )}

              {/* Date range */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>From</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ background: "var(--surface-sunken)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>To</label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ background: "var(--surface-sunken)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
                />
              </div>

              {/* Score range */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Score ≥</label>
                <input type="number" min={0} max={100} value={minScore} onChange={(e) => setMinScore(e.target.value)}
                  placeholder="0"
                  className="w-20 px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ background: "var(--surface-sunken)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Score ≤</label>
                <input type="number" min={0} max={100} value={maxScore} onChange={(e) => setMaxScore(e.target.value)}
                  placeholder="100"
                  className="w-20 px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ background: "var(--surface-sunken)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
                />
              </div>

              {anyFilter && (
                <button onClick={clearAll} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                  style={{ background: "var(--danger-subtle)", color: "var(--danger)" }}>
                  <X size={12} /> Clear filters
                </button>
              )}
            </div>

            {/* Active filter chips */}
            {anyFilter && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {query.trim() && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "var(--brand-subtle)", color: "var(--brand)" }}>
                    Search: {query.trim()}
                    <button onClick={() => setQuery("")}><X size={10} /></button>
                  </span>
                )}
                {deviceFilter !== "all" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "var(--brand-subtle)", color: "var(--brand)" }}>
                    Device: {deviceFilter}
                    <button onClick={() => setDeviceFilter("all")}><X size={10} /></button>
                  </span>
                )}
                {protocolFilter !== "all" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "var(--brand-subtle)", color: "var(--brand)" }}>
                    Protocol: {protocolFilter}
                    <button onClick={() => setProtocolFilter("all")}><X size={10} /></button>
                  </span>
                )}
                {dateFrom && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "var(--brand-subtle)", color: "var(--brand)" }}>
                    From: {dateFrom}
                    <button onClick={() => setDateFrom("")}><X size={10} /></button>
                  </span>
                )}
                {dateTo && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "var(--brand-subtle)", color: "var(--brand)" }}>
                    To: {dateTo}
                    <button onClick={() => setDateTo("")}><X size={10} /></button>
                  </span>
                )}
                {minScore !== "" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "var(--brand-subtle)", color: "var(--brand)" }}>
                    Score ≥ {minScore}
                    <button onClick={() => setMinScore("")}><X size={10} /></button>
                  </span>
                )}
                {maxScore !== "" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "var(--brand-subtle)", color: "var(--brand)" }}>
                    Score ≤ {maxScore}
                    <button onClick={() => setMaxScore("")}><X size={10} /></button>
                  </span>
                )}
                <span className="text-xs ml-auto" style={{ color: "var(--text-tertiary)" }}>
                  {filtered.length} of {sessions.length} sessions
                </span>
              </div>
            )}
          </div>

          {/* ── Bulk action bar ─────────────────────────────────────────────────── */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border mb-3" style={{ background: "var(--brand-subtle)", borderColor: "var(--brand-muted)" }}>
              <span className="text-sm font-medium" style={{ color: "var(--brand)" }}>
                {selectedIds.size} selected
              </span>
              <div className="flex items-center gap-2 ml-auto">
                {selectedIds.size === 2 && (
                  <Link
                    href={(() => { const [a, b] = [...selectedIds]; return `/sessions/compare?a=${a}&b=${b}`; })()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors"
                    style={{ borderColor: "var(--brand-muted)", color: "var(--brand)", background: "var(--surface-raised)" }}
                  >
                    <GitCompareArrows size={12} /> Compare
                  </Link>
                )}
                <button
                  onClick={() => { setShowTagBar((v) => !v); setTagInput(""); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors"
                  style={{ borderColor: "var(--brand-muted)", color: "var(--brand)", background: "var(--surface-raised)" }}
                >
                  <Tag size={12} /> Tag Selected
                </button>
                <button
                  onClick={exportSelected}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  style={{ background: "var(--brand)", color: "var(--text-inverse)" }}
                >
                  <Download size={12} /> Export Selected
                </button>
                <button onClick={() => setSelectedIds(new Set())} style={{ color: "var(--text-tertiary)" }}>
                  <X size={16} />
                </button>
              </div>
              {showTagBar && (
                <div className="w-full flex items-center gap-2 mt-2 pt-2 border-t" style={{ borderColor: "var(--brand-muted)" }}>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Enter tag name…"
                    className="flex-1 px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
                  />
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    Tag applied via bulk edit in session detail pages.
                  </span>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Table ──────────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
        <table className="w-full text-sm">
          <thead className="border-b" style={{ background: "var(--surface-sunken)", borderColor: "var(--border-subtle)" }}>
            <tr>
              <th className="px-4 py-3 w-8">
                <input type="checkbox" checked={allSelected} onChange={toggleAll}
                  className="rounded accent-blue-600" />
              </th>
              <th className="text-left px-4 py-3">
                <button onClick={() => toggleSort("client")} className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                  Client <SortIcon col="client" />
                </button>
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Protocol</th>
              <th className="text-left px-4 py-3">
                <button onClick={() => toggleSort("date")} className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                  Date <SortIcon col="date" />
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button onClick={() => toggleSort("duration")} className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                  Duration <SortIcon col="duration" />
                </button>
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Trend</th>
              <th className="text-left px-4 py-3">
                <button onClick={() => toggleSort("score")} className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                  Avg Reward <SortIcon col="score" />
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button onClick={() => toggleSort("focusDelta")} className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                  Focus Δ <SortIcon col="focusDelta" />
                </button>
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-5 py-12 text-center" style={{ color: "var(--text-tertiary)" }}>
                  {query
                    ? `No sessions match "${query}".`
                    : <>No sessions recorded yet.{" "}<Link href="/sessions/live" style={{ color: "var(--brand)" }} className="hover:underline">Start a live session</Link> to begin.</>}
                </td>
              </tr>
            ) : (
              sorted.map((s) => {
                const isSelected = selectedIds.has(s.id);
                return (
                  <tr key={s.id} className="transition-colors"
                    style={{ background: isSelected ? "var(--brand-subtle)" : undefined }}>
                    <td className="px-4 py-3.5">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleRow(s.id)}
                        className="rounded accent-blue-600" />
                    </td>
                    <td className="px-4 py-3.5">
                      <Link href={`/clients/${s.clientId}`} className="font-medium hover:underline" style={{ color: "var(--text-primary)" }}>
                        {s.clientName}
                      </Link>
                      {s.tags && s.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {s.tags.map((tag) => (
                            <span key={tag} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: "var(--brand-subtle)", color: "var(--brand)" }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5" style={{ color: "var(--text-secondary)" }}>
                      {s.protocolName ?? <span style={{ color: "var(--text-tertiary)" }}>—</span>}
                    </td>
                    <td className="px-4 py-3.5" style={{ color: "var(--text-secondary)" }}>
                      {new Date(s.startedAt).toLocaleDateString()}{" "}
                      <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                        {new Date(s.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </td>
                    <td className="px-4 py-3.5" style={{ color: "var(--text-secondary)" }}>{fmtDuration(s.durationSeconds)}</td>
                    <td className="px-4 py-3.5"><Sparkline data={sparklines[s.id] ?? []} /></td>
                    <td className="px-4 py-3.5">
                      {s.avgRewardScore != null ? (
                        <span className="font-semibold" style={{
                          color: s.avgRewardScore >= 70 ? "var(--success)" : s.avgRewardScore >= 40 ? "var(--warning)" : "var(--danger)"
                        }}>
                          {s.avgRewardScore.toFixed(1)}
                        </span>
                      ) : <span style={{ color: "var(--text-tertiary)" }}>—</span>}
                    </td>
                    <td className="px-4 py-3.5" style={{ color: "var(--text-secondary)" }}>
                      {s.preFocus != null && s.postFocus != null ? (
                        <span>
                          {s.preFocus} →{" "}
                          <span style={{
                            color: s.postFocus > s.preFocus ? "var(--success)" : s.postFocus < s.preFocus ? "var(--danger)" : "var(--text-secondary)",
                            fontWeight: s.postFocus !== s.preFocus ? 600 : undefined,
                          }}>
                            {s.postFocus}
                          </span>
                        </span>
                      ) : <span style={{ color: "var(--text-tertiary)" }}>—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link href={`/sessions/${s.id}`} className="text-xs font-medium hover:underline" style={{ color: "var(--brand)" }}>
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
