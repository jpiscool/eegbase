"use client";

import { useState, useRef, useEffect } from "react";

export type Role = "clinician" | "home" | "researcher";

const ROLES: { id: Role; label: string; subtitle: string; disabled?: boolean }[] = [
  { id: "clinician", label: "Clinician",  subtitle: "Run sessions for clients" },
  { id: "home",      label: "Home user",  subtitle: "Train yourself at home" },
  { id: "researcher", label: "Researcher", subtitle: "Coming soon", disabled: true },
];

interface RoleToggleProps {
  role: Role;
  setRole: (r: Role) => void;
}

// Compact "View as" picker in the header. Hover/click reveals the choices.
// Persists in localStorage via the parent shell.
export function RoleToggle({ role, setRole }: RoleToggleProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const current = ROLES.find((r) => r.id === role) ?? ROLES[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white hover:bg-gray-50"
      >
        <span className="hidden sm:inline text-gray-400">View as</span>
        <span className="font-medium text-gray-900">{current.label}</span>
        <span aria-hidden className="text-gray-400 text-[10px]">▾</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-30"
        >
          {ROLES.map((r) => {
            const active = r.id === role;
            return (
              <button
                key={r.id}
                disabled={r.disabled}
                onClick={() => {
                  if (r.disabled) return;
                  setRole(r.id);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-colors ${
                  r.disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
                }`}
                role="menuitemradio"
                aria-checked={active}
              >
                <span>
                  <span className={`block text-sm ${active ? "font-semibold text-gray-900" : "text-gray-800"}`}>{r.label}</span>
                  <span className="block text-xs text-gray-500 mt-0.5">{r.subtitle}</span>
                </span>
                {active && <span aria-hidden className="text-blue-600 text-sm">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
