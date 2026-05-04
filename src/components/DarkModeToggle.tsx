"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function DarkModeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("eegbase-theme");
    if (stored === "dark") {
      setDark(true);
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("eegbase-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("eegbase-theme", "light");
    }
  }

  return (
    <button
      onClick={toggle}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition-colors"
      style={{ color: "var(--text-secondary)" }}
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
      <span className="text-xs">{dark ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}
