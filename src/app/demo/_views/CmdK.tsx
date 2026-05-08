"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CLIENTS } from "../_data/clients";

type Surface = "today" | "patients" | "session";

interface CmdKProps {
  open: boolean;
  setOpen: (v: boolean) => void;
  goSurface: (s: Surface) => void;
  startSession: (clientId: string) => void;
  openPatient: (clientId: string) => void;
}

type Cmd = { id: string; label: string; hint?: string; run: () => void; group: string };

export function CmdK({ open, setOpen, goSurface, startSession, openPatient }: CmdKProps) {
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global shortcut: ⌘K / Ctrl-K to toggle, "/" when not in an input.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
        return;
      }
      if (e.key === "/" && !open) {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName?.toLowerCase();
        if (tag !== "input" && tag !== "textarea" && !(target?.isContentEditable)) {
          e.preventDefault();
          setOpen(true);
        }
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  // Focus the input when the palette opens.
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  const allCmds: Cmd[] = useMemo(
    () => [
      { id: "go-today",    group: "Go to", label: "Today",    hint: "home",          run: () => { goSurface("today"); setOpen(false); } },
      { id: "go-patients", group: "Go to", label: "Patients", hint: "all clients",   run: () => { goSurface("patients"); setOpen(false); } },
      ...CLIENTS.map<Cmd>((c) => ({
        id: `start-${c.id}`,
        group: "Start session",
        label: `Start session with ${c.name}`,
        hint: c.protocol,
        run: () => { startSession(c.id); setOpen(false); },
      })),
      ...CLIENTS.map<Cmd>((c) => ({
        id: `open-${c.id}`,
        group: "Open patient",
        label: c.name,
        hint: c.archetype,
        run: () => { openPatient(c.id); setOpen(false); },
      })),
      { id: "help", group: "Help", label: "Help & shortcuts", hint: "⌘K to open this", run: () => setOpen(false) },
    ],
    [goSurface, startSession, openPatient, setOpen]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allCmds;
    return allCmds.filter((c) => (c.label + " " + (c.hint ?? "") + " " + c.group).toLowerCase().includes(q));
  }, [query, allCmds]);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); filtered[activeIdx]?.run(); }
  }

  if (!open) return null;

  // Group by `group` field while preserving filter order.
  const groups: { name: string; cmds: Cmd[] }[] = [];
  filtered.forEach((c) => {
    const g = groups.find((g) => g.name === c.group);
    if (g) g.cmds.push(c);
    else groups.push({ name: c.group, cmds: [c] });
  });

  let runningIdx = -1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onClick={() => setOpen(false)}
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-gray-900/40 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setActiveIdx(0); }}
          onKeyDown={onKeyDown}
          placeholder="Search or jump to…"
          aria-label="Command palette search"
          className="w-full px-5 py-4 text-base bg-white border-b border-gray-100 outline-none placeholder-gray-400"
        />
        <div className="max-h-80 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="px-5 py-6 text-sm text-gray-400 text-center">No matches for &ldquo;{query}&rdquo;</p>
          )}
          {groups.map((g) => (
            <div key={g.name}>
              <p className="px-5 pt-3 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{g.name}</p>
              <ul>
                {g.cmds.map((c) => {
                  runningIdx++;
                  const idx = runningIdx;
                  const isActive = idx === activeIdx;
                  return (
                    <li key={c.id}>
                      <button
                        onMouseEnter={() => setActiveIdx(idx)}
                        onClick={c.run}
                        className={`w-full text-left px-5 py-2.5 flex items-center justify-between gap-3 ${isActive ? "bg-blue-50" : ""}`}
                      >
                        <span className={`text-sm ${isActive ? "text-blue-900 font-medium" : "text-gray-800"}`}>{c.label}</span>
                        {c.hint && <span className="text-xs text-gray-400 truncate">{c.hint}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100 text-[11px] text-gray-400 flex items-center gap-3">
          <span><kbd className="bg-white border border-gray-200 rounded px-1.5 py-0.5 font-mono text-[10px]">↑↓</kbd> navigate</span>
          <span><kbd className="bg-white border border-gray-200 rounded px-1.5 py-0.5 font-mono text-[10px]">↵</kbd> select</span>
          <span className="ml-auto"><kbd className="bg-white border border-gray-200 rounded px-1.5 py-0.5 font-mono text-[10px]">esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
