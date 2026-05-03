"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { clsx } from "clsx";
import { SignOutButton } from "./SignOutButton";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, badge: null as string | null },
  { href: "/clients", label: "Clients", icon: Users, badge: null as string | null },
  { href: "/sessions", label: "Sessions", icon: Activity, badge: null as string | null },
  { href: "/analytics", label: "Analytics", icon: BarChart3, badge: null as string | null },
  { href: "/protocols", label: "Protocols", icon: BookOpen, badge: null as string | null },
  { href: "/devices", label: "Devices", icon: Bluetooth, badge: null as string | null },
  { href: "/settings", label: "Settings", icon: Settings, badge: null as string | null },
];

export function Sidebar({
  userName,
  userEmail,
  unreadMessages = 0,
}: {
  userName?: string;
  userEmail?: string;
  unreadMessages?: number;
}) {
  const pathname = usePathname();

  // Inject badges dynamically
  const navWithBadges = nav.map((item) => ({
    ...item,
    badge:
      item.href === "/clients" && unreadMessages > 0
        ? String(unreadMessages > 99 ? "99+" : unreadMessages)
        : null,
  }));

  return (
    <aside className="w-60 shrink-0 border-r border-gray-200 bg-white flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-200">
        <span className="text-xl font-bold tracking-tight text-gray-900">
          EEG<span className="text-blue-600">Base</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <Link
          href="/sessions/live"
          className="flex items-center gap-2 w-full px-3 py-2 mb-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Play size={15} />
          Start Session
        </Link>

        {/* Search trigger */}
        <button
          onClick={() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
          }}
          className="flex items-center gap-2 w-full px-3 py-2 mb-1 text-gray-400 text-sm rounded-lg hover:bg-gray-100 hover:text-gray-600 transition-colors border border-dashed border-gray-200"
        >
          <Search size={14} />
          <span className="flex-1 text-left text-xs">Search…</span>
          <kbd className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
        </button>
        {navWithBadges.map(({ href, label, icon: Icon, badge }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname.startsWith(href)
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <Icon size={18} />
            <span className="flex-1">{label}</span>
            {badge && (
              <span className="ml-auto min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-red-500 rounded-full flex items-center justify-center">
                {badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* User + Sign out */}
      <div className="px-4 py-4 border-t border-gray-200">
        {userName && (
          <div className="mb-3 px-2">
            <p className="text-sm font-medium text-gray-800 truncate">{userName}</p>
            {userEmail && (
              <p className="text-xs text-gray-400 truncate">{userEmail}</p>
            )}
          </div>
        )}
        <SignOutButton />
      </div>
    </aside>
  );
}
