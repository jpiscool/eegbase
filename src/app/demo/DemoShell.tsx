"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { TodayView } from "./_views/TodayView";
import { PatientsView } from "./_views/PatientsView";
import { SessionView } from "./_views/SessionView";
import { CmdK } from "./_views/CmdK";
import { RoleToggle, type Role } from "./_components/RoleToggle";
import { SettingsSheet } from "./_components/SettingsSheet";
import type { SessionType } from "./_data/session-types";

type Surface = "today" | "patients" | "session";

interface DemoShellProps {
  initialSurface: Surface;
  initialClientId?: string;
}

const TODAY_DATE = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
const ROLE_KEY = "eegbase-demo-role";

export default function DemoShell({ initialSurface, initialClientId }: DemoShellProps) {
  const [surface, setSurface] = useState<Surface>(initialSurface);
  const [activeClientId, setActiveClientId] = useState<string | undefined>(initialClientId);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [role, setRoleState] = useState<Role>("clinician");
  const [sessionType, setSessionType] = useState<SessionType | null>(null);
  const [sessionMinutes, setSessionMinutes] = useState(12);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Hydrate role from localStorage so a returning visitor stays in their last view.
  useEffect(() => {
    try {
      const v = localStorage.getItem(ROLE_KEY);
      if (v === "clinician" || v === "home" || v === "researcher") setRoleState(v);
    } catch {}
  }, []);

  function setRole(r: Role) {
    setRoleState(r);
    try { localStorage.setItem(ROLE_KEY, r); } catch {}
    // Switching roles resets the surface to Today so the change is visible immediately.
    setSurface("today");
    setActiveClientId(undefined);
  }

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

  function startSession(clientId: string, type?: SessionType, minutes?: number) {
    setActiveClientId(clientId);
    if (type) setSessionType(type);
    if (minutes != null) setSessionMinutes(minutes);
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
      <div className="no-print bg-amber-50 border-b border-amber-100 text-amber-900 text-xs px-4 py-1.5 text-center" role="status">
        Demo mode · sample data · press <kbd className="bg-white border border-amber-200 rounded px-1 py-0.5 font-mono text-[10px]">⌘K</kbd> to navigate
      </div>

      {/* Slim header — logo · date · search · role · dark toggle (hidden in print via existing print rule that targets <header>) */}
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
            <RoleToggle role={role} setRole={setRole} />
            <button
              onClick={() => setSettingsOpen(true)}
              aria-label="Open settings"
              className="text-xs text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white hover:bg-gray-50"
            >
              ⚙
            </button>
            {/* Dark-mode toggle hidden until v3 — current implementation only flips the
                outer wrapper, not card surfaces. Shipping a half-broken control is worse
                than not shipping it. The state + handler stay so re-enabling is one
                JSX edit away once cards adopt dark variants. */}
          </div>
        </div>
      </header>

      {/* Surface area */}
      <div className="bg-gray-50">
        {surface === "today" && (
          <TodayView role={role} onStartSession={startSession} onOpenPatient={openPatient} />
        )}
        {surface === "patients" && (
          <PatientsView role={role} initialClientId={activeClientId} onStartSession={startSession} />
        )}
        {surface === "session" && (
          <SessionView
            clientId={activeClientId ?? "sarah"}
            sessionType={sessionType ?? undefined}
            sessionMinutes={sessionMinutes}
            role={role}
            onExit={() => goSurface("today")}
          />
        )}
      </div>

      {/* Cmd-K command palette */}
      <CmdK
        role={role}
        open={cmdOpen}
        setOpen={setCmdOpen}
        goSurface={goSurface}
        startSession={startSession}
        openPatient={openPatient}
      />

      {/* Settings sheet */}
      <SettingsSheet open={settingsOpen} setOpen={setSettingsOpen} />
    </div>
  );
}
