"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Activity,
  BookOpen,
  Settings,
} from "lucide-react";
import { clsx } from "clsx";
import { SignOutButton } from "./SignOutButton";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/sessions", label: "Sessions", icon: Activity },
  { href: "/protocols", label: "Protocols", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ userName, userEmail }: { userName?: string; userEmail?: string }) {
  const pathname = usePathname();

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
        {nav.map(({ href, label, icon: Icon }) => (
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
            {label}
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
