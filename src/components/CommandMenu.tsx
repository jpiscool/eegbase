"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, Activity, BookOpen, X } from "lucide-react";

interface Result {
  id: string;
  label: string;
  sub: string;
  href: string;
  group: string;
}

const GROUP_ICONS: Record<string, React.ComponentType<{ size: number; className?: string }>> = {
  Clients: Users,
  Sessions: Activity,
  Protocols: BookOpen,
};

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

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIdx]) {
      navigate(results[activeIdx].href);
    }
  }

  if (!open) return null;

  // Group results for display
  const groups: Record<string, Result[]> = {};
  for (const r of results) {
    if (!groups[r.group]) groups[r.group] = [];
    groups[r.group].push(r);
  }

  let flatIdx = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search clients, sessions, protocols…"
            className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
          )}
          <button
            onClick={() => setOpen(false)}
            className="text-gray-400 hover:text-gray-600 shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto">
          {results.length === 0 && query.length >= 2 && !loading && (
            <p className="text-sm text-gray-400 text-center py-8">No results for &ldquo;{query}&rdquo;</p>
          )}
          {query.length < 2 && (
            <p className="text-xs text-gray-400 text-center py-6">
              Type at least 2 characters to search
            </p>
          )}
          {Object.entries(groups).map(([group, items]) => {
            const Icon = GROUP_ICONS[group] ?? Search;
            return (
              <div key={group}>
                <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">
                  {group}
                </div>
                {items.map((r) => {
                  const idx = flatIdx++;
                  const isActive = idx === activeIdx;
                  return (
                    <button
                      key={r.id}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isActive ? "bg-blue-50" : "hover:bg-gray-50"
                      }`}
                      onClick={() => navigate(r.href)}
                      onMouseEnter={() => setActiveIdx(idx)}
                    >
                      <Icon
                        size={15}
                        className={isActive ? "text-blue-500" : "text-gray-400"}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{r.label}</p>
                        {r.sub && <p className="text-xs text-gray-400 truncate">{r.sub}</p>}
                      </div>
                      {isActive && (
                        <span className="text-xs text-blue-400 shrink-0">↵</span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {results.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-3 text-xs text-gray-400">
            <span>↑↓ navigate</span>
            <span>↵ select</span>
            <span>esc close</span>
          </div>
        )}
      </div>
    </div>
  );
}
