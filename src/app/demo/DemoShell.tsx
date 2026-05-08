"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { TodayView } from "./_views/TodayView";
import { PatientsView } from "./_views/PatientsView";
import { SessionView } from "./_views/SessionView";
import { CmdK } from "./_views/CmdK";
import { ChecklistDock } from "./_components/ChecklistDock";

type Surface = "today" | "patients" | "session";

interface DemoShellProps {
  initialSurface: Surface;
  initialClientId?: string;
}

const TODAY_DATE = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

export default function DemoShell({ initialSurface, initialClientId }: DemoShellProps) {
  const [surface, setSurface] = useState<Surface>(initialSurface);
  const [activeClientId, setActiveClientId] = useState<string | undefined>(initialClientId);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [dark, setDark] = useState(false);

  // Sync URL ?surface= without a full reload — useful for browser back-button.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (surface === "today") params.delete("surface");
    else params.set("surface", surface);
    if (activeClientId) params.set("client", activeClientId);
    else params.delete("client");
    const qs = params.toString();
    const url = qs ? `?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [surface, activeClientId]);

  function startSession(clientId: string) {
    setActiveClientId(clientId);
    setSurface("session");
  }
  function openPatient(clientId: string) {
    setActiveClientId(clientId);
    setSurface("patients");
  }
  function goSurface(s: Surface) {
    setSurface(s);
    if (s !== "patients") setActiveClientId(undefined);
  }

  return (
    <div className={`min-h-screen ${dark ? "bg-gray-950 text-gray-100" : "bg-gray-50 text-gray-900"} transition-colors`}>
      {/* Demo ribbon — one line, no animation */}
      <div className="bg-amber-50 border-b border-amber-100 text-amber-900 text-xs px-4 py-1.5 text-center" role="status">
        Demo mode · sample data · press <kbd className="bg-white border border-amber-200 rounded px-1 py-0.5 font-mono text-[10px]">⌘K</kbd> to navigate
      </div>

      {/* Slim header — logo · date · search · dark toggle */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold" aria-hidden>EB</span>
            <span className="font-bold text-sm text-gray-900">EEGBase</span>
          </Link>
          <span className="text-xs text-gray-400 ml-2 hidden sm:inline">{TODAY_DATE}</span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setCmdOpen(true)}
              aria-label="Open command palette"
              className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-2.5 py-1.5"
            >
              <span aria-hidden>🔍</span>
              <span className="hidden sm:inline">Search</span>
              <kbd className="font-mono text-[10px] bg-white border border-gray-200 rounded px-1 py-0.5 hidden md:inline">⌘K</kbd>
            </button>
            <button
              onClick={() => setDark(d => !d)}
              aria-label="Toggle dark mode"
              className="text-xs text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white hover:bg-gray-50"
            >
              {dark ? "☀" : "☾"}
            </button>
          </div>
        </div>
      </header>

      {/* Surface area — wrapper keeps a stable max-width and white card under content */}
      <div className="bg-gray-50">
        {surface === "today" && (
          <TodayView onStartSession={startSession} onOpenPatient={openPatient} />
        )}
        {surface === "patients" && (
          <PatientsView initialClientId={activeClientId} onStartSession={startSession} />
        )}
        {surface === "session" && (
          <SessionView clientId={activeClientId ?? "sarah"} onExit={() => goSurface("today")} />
        )}
      </div>

      {/* Cmd-K command palette */}
      <CmdK
        open={cmdOpen}
        setOpen={setCmdOpen}
        goSurface={goSurface}
        startSession={startSession}
        openPatient={openPatient}
      />

      {/* Bottom-right onboarding checklist */}
      <ChecklistDock />
    </div>
  );
}
