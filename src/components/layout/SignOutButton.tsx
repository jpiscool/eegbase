"use client";

import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/auth-actions";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        style={{ color: "var(--sidebar-text-muted)" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "color-mix(in srgb, var(--danger) 12%, transparent)";
          e.currentTarget.style.color = "var(--danger)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "";
          e.currentTarget.style.color = "var(--sidebar-text-muted)";
        }}
      >
        <LogOut size={16} />
        Sign out
      </button>
    </form>
  );
}
