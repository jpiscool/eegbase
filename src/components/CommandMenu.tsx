"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Users, Activity, BookOpen, X, Zap, UserPlus,
  Receipt, BarChart3, CalendarDays, Settings, FileText, ArrowRight,
} from "lucide-react";

interface Result {
  id: string;
  label: string;
  sub: string;
  href: string;
  group: string;
  icon?: React.ComponentType<{ size: number }>;
}

const QUICK_ACTIONS: Result[] = [
  { id: "qa-start",    label: "Start Live Session",  sub: "Begin a neurofeedback session",   href: "/sessions/live", group: "Quick Actions", icon: Zap },
  { id: "qa-client",  label: "Add New Client",       sub: "Create a client record",          href: "/clients",       group: "Quick Actions", icon: UserPlus },
  { id: "qa-billing", label: "Go to Billing",        sub: "Invoices & revenue",              href: "/billing",       group: "Quick Actions", icon: Receipt },
  { id: "qa-sched",   label: "Schedule Appointment", sub: "Book a session time",             href: "/schedule",      group: "Quick Actions", icon: CalendarDays },
  { id: "qa-anal",    label: "Analytics",            sub: "Clinic performance data",         href: "/analytics",     group: "Quick Actions", icon: BarChart3 },
  { id: "qa-proto",   label: "Protocols",            sub: "Manage training protocols",       href: "/protocols",     group: "Quick Actions", icon: BookOpen },
  { id: "qa-docs",    label: "API Documentation",    sub: "Integration docs & webhooks",     href: "/docs",          group: "Quick Actions", icon: FileText },
  { id: "qa-settings",label: "Settings",             sub: "Clinic & account settings",       href: "/settings",      group: "Quick Actions", icon: Settings },
];

const GROUP_ICONS: Record<string, React.ComponentType<{ size: number }>> = {
  Clients: Users,
  Sessions: Activity,
  Protocols: BookOpen,
  "Quick Actions": Zap,
};

const GROUP_ORDER = ["Quick Actions", "Clients", "Sessions", "Protocols"];

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Open on Cmd+K / Ctrl+K
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
      setQuery("");
      setResults([]);
      setActiveIdx(0);
    }
  }, [open]);

  // Fetch results
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setActiveIdx(0);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        const flat: Result[] = [
          ...(data.clients ?? []).map((r: Omit<Result, "group">) => ({ ...r, group: "Clients" })),
          ...(data.sessions ?? []).map((r: Omit<Result, "group">) => ({ ...r, group: "Sessions" })),
          ...(data.protocols ?? []).map((r: Omit<Result, "group">) => ({ ...r, group: "Protocols" })),
        ];
        setResults(flat);
        setActiveIdx(0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [query]);

  const navigate = useCallback(
    (href: string) => {
      router.push(href);
      setOpen(false);
    },
    [router]
  );

  const displayItems = query.length < 2 ? QUICK_ACTIONS : results;

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, displayItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && displayItems[activeIdx]) {
      navigate(displayItems[activeIdx].href);
    }
  }

  if (!open) return null;

  // Group items for display
  const groups: Record<string, Result[]> = {};
  for (const r of displayItems) {
    if (!groups[r.group]) groups[r.group] = [];
    groups[r.group].push(r);
  }

  const sortedGroupEntries = Object.entries(groups).sort(([a], [b]) => {
    const ai = GROUP_ORDER.indexOf(a);
    const bi = GROUP_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  let flatIdx = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[14vh] animate-fade-in"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl mx-4 overflow-hidden animate-slide-up"
        style={{
          background: "var(--surface-overlay)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.22), 0 0 0 1px var(--border-subtle)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-3 px-4 py-3.5"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <Search size={17} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIdx(0); }}
            onKeyDown={handleKey}
            placeholder="Search clients, sessions, protocols…"
            style={{ flex: 1, fontSize: "14px", color: "var(--text-primary)", background: "transparent", border: "none", outline: "none" }}
          />
          {loading && (
            <div className="w-4 h-4 rounded-full shrink-0 animate-spin" style={{ border: "2px solid var(--brand)", borderTopColor: "transparent" }} />
          )}
          <button onClick={() => setOpen(false)} className="shrink-0" style={{ color: "var(--text-tertiary)" }}>
            <X size={15} />
          </button>
        </div>

        {/* Results / Quick Actions */}
        <div style={{ maxHeight: "380px", overflowY: "auto" }}>
          {query.length >= 2 && results.length === 0 && !loading && (
            <div className="py-10 text-center" style={{ color: "var(--text-tertiary)", fontSize: "13px" }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
          {sortedGroupEntries.map(([group, items]) => {
            const DefaultIcon = GROUP_ICONS[group] ?? Search;
            return (
              <div key={group}>
                <div
                  className="px-4 py-2"
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--text-tertiary)",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    background: "var(--surface-sunken)",
                    borderBottom: "1px solid var(--border-subtle)",
                  }}
                >
                  {group}
                </div>
                {items.map((r) => {
                  const idx = flatIdx++;
                  const isActive = idx === activeIdx;
                  const Icon = r.icon ?? DefaultIcon;
                  return (
                    <button
                      key={r.id}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                      style={{
                        background: isActive ? "var(--brand-subtle)" : "transparent",
                        borderLeft: `2px solid ${isActive ? "var(--brand)" : "transparent"}`,
                      }}
                      onClick={() => navigate(r.href)}
                      onMouseEnter={() => setActiveIdx(idx)}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          background: isActive ? "var(--brand)" : "var(--surface-sunken)",
                          color: isActive ? "white" : "var(--text-tertiary)",
                          border: isActive ? "none" : "1px solid var(--border-subtle)",
                        }}
                      >
                        <Icon size={13} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "13px", fontWeight: 500, color: isActive ? "var(--brand)" : "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {r.label}
                        </p>
                        {r.sub && (
                          <p style={{ fontSize: "11px", color: "var(--text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {r.sub}
                          </p>
                        )}
                      </div>
                      {isActive && <ArrowRight size={13} style={{ color: "var(--brand)", flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          className="flex items-center gap-4 px-4 py-2.5"
          style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--surface-sunken)" }}
        >
          {(["↑↓ navigate", "↵ select", "esc close"] as const).map((hint) => (
            <span key={hint} style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>{hint}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
