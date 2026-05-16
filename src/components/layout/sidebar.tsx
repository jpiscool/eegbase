"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Activity, Settings, UserCircle, ChevronRight } from "lucide-react";
import { clsx } from "clsx";
import { SignOutButton } from "./SignOutButton";

// Minimal authenticated-app sidebar. Per scripts/mendi-capture/
// live-site-test-priorities.md, the clinician app is stripped to the
// minimum surface needed to validate Tier 0–1 against real Mendi hardware.
// As each tier ships, add its routes back to NAV.
const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sessions",  label: "Sessions",  icon: Activity },
  { href: "/profile",   label: "Profile",   icon: UserCircle },
  { href: "/settings",  label: "Settings",  icon: Settings },
];

export function Sidebar({
  userName,
  userEmail,
}: {
  userName?: string;
  userEmail?: string;
  // Kept as optional pass-throughs so existing layout callers compile
  // unchanged. They're intentionally ignored — no notification/queue UI
  // is rendered in the stripped surface.
  unreadMessages?: number;
  notificationCount?: number;
  reviewQueueCount?: number;
}) {
  const pathname = usePathname();
  const initials = userName
    ? userName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <aside
      data-sidebar
      className="w-60 shrink-0 flex flex-col min-h-screen"
      style={{
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--sidebar-border)",
      }}
    >
      {/* Logo */}
      <div
        className="px-5 py-5 flex items-center gap-2.5"
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "var(--brand)" }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
            <path d="M3 12 Q6 6 12 6 Q18 6 21 12 Q18 18 12 18 Q6 18 3 12Z" stroke="white" strokeWidth="1.5" fill="none" />
            <circle cx="12" cy="12" r="2.5" fill="white" />
          </svg>
        </div>
        <span className="text-[15px] font-semibold tracking-tight" style={{ color: "var(--text-inverse)" }}>
          EEG<span style={{ color: "var(--sidebar-accent)" }}>Base</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pt-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all border-l-2",
                active ? "" : "border-transparent",
              )}
              style={
                active
                  ? {
                      background: "var(--sidebar-surface)",
                      color: "var(--text-inverse)",
                      borderLeftColor: "var(--sidebar-accent)",
                    }
                  : { color: "var(--sidebar-text)", borderLeftColor: "transparent" }
              }
            >
              <Icon
                size={16}
                className="shrink-0"
                style={{ color: active ? "var(--sidebar-accent)" : "var(--sidebar-text-muted)" }}
              />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={12} style={{ color: "var(--sidebar-text-muted)" }} />}
            </Link>
          );
        })}
      </nav>

      {/* User row + Sign Out */}
      <div className="px-3 py-4" style={{ borderTop: "1px solid var(--sidebar-border)" }}>
        {userName && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg mb-1">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{
                background: "var(--sidebar-surface)",
                color: "var(--sidebar-accent)",
                border: "1px solid var(--sidebar-border)",
              }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: "var(--text-inverse)" }}>
                {userName}
              </p>
              {userEmail && (
                <p className="text-[10px] truncate" style={{ color: "var(--sidebar-text-muted)" }}>
                  {userEmail}
                </p>
              )}
            </div>
          </div>
        )}
        <SignOutButton />
      </div>
    </aside>
  );
}
