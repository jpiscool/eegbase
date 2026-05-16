"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Activity,
  BookOpen,
  Settings,
  Play,
  Search,
  BarChart3,
  Bluetooth,
  FileText,
  UsersRound,
  CalendarDays,
  Receipt,
  Bell,
  ChevronRight,
  Package,
  MessageSquare,
  ClipboardCheck,
  ShoppingBag,
  Shield,
  Code2,
} from "lucide-react";
import { clsx } from "clsx";
import { SignOutButton } from "./SignOutButton";
import { DarkModeToggle } from "@/components/DarkModeToggle";

const nav: { href: string; label: string; icon: LucideIcon; badge?: string }[] = [
  { href: "/dashboard",              label: "Dashboard",    icon: LayoutDashboard },
  { href: "/clients",                label: "Clients",      icon: Users },
  { href: "/sessions",               label: "Sessions",     icon: Activity },
  { href: "/sessions/review",        label: "Review Queue", icon: ClipboardCheck },
  { href: "/messages",               label: "Messages",     icon: MessageSquare },
  { href: "/analytics",              label: "Analytics",    icon: BarChart3 },
  { href: "/protocols",              label: "Protocols",    icon: BookOpen },
  { href: "/protocols/marketplace",  label: "Marketplace",  icon: ShoppingBag },
  { href: "/schedule",               label: "Schedule",     icon: CalendarDays },
  { href: "/billing",                label: "Billing",      icon: Receipt },
  { href: "/devices",                label: "Devices",      icon: Bluetooth },
  { href: "/community",              label: "Community",    icon: UsersRound },
  { href: "/docs",                   label: "API Docs",     icon: FileText },
  { href: "/docs/mendi-sdk",         label: "Mendi BLE",    icon: Code2 },
  { href: "/settings/inventory",     label: "Inventory",    icon: Package },
];

const bottomNav = [
  { href: "/settings/audit-log", label: "Audit Log", icon: Shield },
  { href: "/settings",          label: "Settings",   icon: Settings },
];

export function Sidebar({
  userName,
  userEmail,
  unreadMessages = 0,
  notificationCount = 0,
  reviewQueueCount = 0,
}: {
  userName?: string;
  userEmail?: string;
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
      <div className="px-5 py-5 flex items-center gap-2.5" style={{ borderBottom: "1px solid var(--sidebar-border)" }}>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "var(--brand)" }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
            <path d="M3 12 Q6 6 12 6 Q18 6 21 12 Q18 18 12 18 Q6 18 3 12Z" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="12" cy="12" r="2.5" fill="white"/>
            <path d="M8 9.5 Q10 7 12 7" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M16 9.5 Q14 7 12 7" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </div>
        <span className="text-[15px] font-semibold tracking-tight" style={{ color: "var(--text-inverse)" }}>
          EEG<span style={{ color: "var(--sidebar-accent)" }}>Base</span>
        </span>
      </div>

      {/* Start Session CTA */}
      <div className="px-3 pt-4 pb-2">
        <Link
          href="/sessions/live"
          className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: "var(--brand)",
            color: "var(--text-inverse)",
            boxShadow: "0 2px 8px rgb(37 99 235 / 0.35)",
          }}
        >
          <Play size={14} strokeWidth={2.5} />
          Start Session
        </Link>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }))}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors"
          style={{
            background: "var(--sidebar-surface)",
            color: "var(--sidebar-text-muted)",
            border: "1px solid var(--sidebar-border)",
          }}
        >
          <Search size={13} />
          <span className="flex-1 text-left text-xs">Search…</span>
          <kbd className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: "var(--sidebar-bg)", color: "var(--sidebar-text-muted)" }}>⌘K</kbd>
        </button>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-4">
        {nav.map(({ href, label, icon: Icon, badge: staticBadge }) => {
          const active = pathname.startsWith(href);
          const badge =
            href === "/messages" && unreadMessages > 0
              ? String(unreadMessages > 99 ? "99+" : unreadMessages)
              : href === "/sessions/review" && reviewQueueCount > 0
              ? String(reviewQueueCount > 99 ? "99+" : reviewQueueCount)
              : staticBadge ?? null;
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all relative",
                active
                  ? "border-l-2"
                  : "border-l-2 border-transparent"
              )}
              style={
                active
                  ? {
                      background: "var(--sidebar-surface)",
                      color: "var(--text-inverse)",
                      borderLeftColor: "var(--sidebar-accent)",
                    }
                  : {
                      color: "var(--sidebar-text)",
                      borderLeftColor: "transparent",
                    }
              }
            >
              <Icon
                size={16}
                className="shrink-0 transition-colors"
                style={{ color: active ? "var(--sidebar-accent)" : "var(--sidebar-text-muted)" }}
              />
              <span className="flex-1">{label}</span>
              {badge && (
                <span
                  className="min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full flex items-center justify-center"
                  style={{ background: "var(--danger)", color: "var(--text-inverse)" }}
                >
                  {badge}
                </span>
              )}
              {active && (
                <ChevronRight size={12} style={{ color: "var(--sidebar-text-muted)" }} />
              )}
            </Link>
          );
        })}

        {/* Separator */}
        <div className="my-2" style={{ borderTop: "1px solid var(--sidebar-border)" }} />

        {/* Bottom nav items (settings group) */}
        {bottomNav.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all relative",
                active
                  ? "border-l-2"
                  : "border-l-2 border-transparent"
              )}
              style={
                active
                  ? {
                      background: "var(--sidebar-surface)",
                      color: "var(--text-inverse)",
                      borderLeftColor: "var(--sidebar-accent)",
                    }
                  : {
                      color: "var(--sidebar-text)",
                      borderLeftColor: "transparent",
                    }
              }
            >
              <Icon
                size={16}
                className="shrink-0 transition-colors"
                style={{ color: active ? "var(--sidebar-accent)" : "var(--sidebar-text-muted)" }}
              />
              <span className="flex-1">{label}</span>
              {active && (
                <ChevronRight size={12} style={{ color: "var(--sidebar-text-muted)" }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Notifications + User + Actions */}
      <div className="px-3 py-4 space-y-1" style={{ borderTop: "1px solid var(--sidebar-border)" }}>
        {/* Notification row */}
        <Link
          href="/notifications"
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors"
          style={{ color: "var(--sidebar-text)" }}
        >
          <span className="relative shrink-0">
            <Bell size={15} style={{ color: "var(--sidebar-text-muted)" }} />
            {notificationCount > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[13px] h-[13px] px-0.5 text-[9px] font-bold rounded-full flex items-center justify-center leading-none"
                style={{ background: "var(--danger)", color: "var(--text-inverse)" }}
              >
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </span>
          <span className="flex-1 text-xs">Notifications</span>
          {notificationCount > 0 && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "var(--danger-subtle)", color: "var(--danger)" }}>
              {notificationCount}
            </span>
          )}
        </Link>

        {/* DarkMode toggle */}
        <DarkModeToggle />

        {/* User row */}
        {userName && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg mt-1">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: "var(--sidebar-surface)", color: "var(--sidebar-accent)", border: "1px solid var(--sidebar-border)" }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: "var(--text-inverse)" }}>{userName}</p>
              {userEmail && <p className="text-[10px] truncate" style={{ color: "var(--sidebar-text-muted)" }}>{userEmail}</p>}
            </div>
          </div>
        )}

        <SignOutButton />
      </div>
    </aside>
  );
}
