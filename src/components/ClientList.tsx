"use client";

import { useState } from "react";
import Link from "next/link";

interface ClientRow {
  id: string;
  name: string;
  email: string | null;
  goals: string | null;
  active: boolean;
  sessionCount: number;
  avgRewardScore: string | null;
  lastSessionAt: Date | null;
}

// Dark-card list matching the My Dashboard aesthetic. Same #111A1F / #1F2A30
// tokens as the dashboard widget grid so the logged-in app reads as one
// surface across routes.
export function ClientList({ clients }: { clients: ClientRow[] }) {
  const [query, setQuery] = useState("");
  const showSearch = clients.length > 6;
  const filtered = query.trim()
    ? clients.filter((c) =>
        (c.name + " " + (c.email ?? "") + " " + (c.goals ?? "")).toLowerCase().includes(query.toLowerCase())
      )
    : clients;

  function initials(name: string) {
    return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  }
  function relativeDays(d: Date | null) {
    if (!d) return "Never";
    const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  }

  const cardStyle: React.CSSProperties = {
    background: "#111A1F",
    border: "1px solid #1F2A30",
    borderRadius: 12,
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.06)",
  };

  if (clients.length === 0) {
    return (
      <div style={{ ...cardStyle, padding: "48px 24px", textAlign: "center" }}>
        <p style={{ color: "#94A3B8", fontSize: 13 }}>
          No clients yet. Add your first client to get started.
        </p>
      </div>
    );
  }

  return (
    <div>
      {showSearch && (
        <div style={{ marginBottom: 16 }}>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients\u2026"
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 10,
              background: "#07090B",
              border: "1px solid #1F2A30",
              color: "#F1F5F9",
              fontSize: 13,
              outline: "none",
              fontFamily: "inherit",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#2DD4BF"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "#1F2A30"; }}
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <p style={{ color: "#7A7268", fontSize: 13, padding: "12px 4px" }}>
          No matches for &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <ul style={{ ...cardStyle, listStyle: "none", padding: 0, margin: 0, overflow: "hidden" }}>
          {filtered.map((c, idx) => (
            <li
              key={c.id}
              style={{
                borderTop: idx === 0 ? "none" : "1px solid #1F2A30",
              }}
            >
              <Link
                href={`/clients/${c.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 18px",
                  textDecoration: "none",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <span
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "rgba(45,212,191,0.12)",
                    color: "#2DD4BF",
                    fontWeight: 700,
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    border: "1px solid rgba(45,212,191,0.22)",
                  }}
                >
                  {initials(c.name)}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#F1F5F9" }}>
                    {c.name}
                  </span>
                  <span
                    style={{
                      display: "block",
                      fontSize: 12,
                      color: "#94A3B8",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      marginTop: 2,
                    }}
                  >
                    {c.goals ? c.goals : c.email ?? "No notes yet"}
                  </span>
                </span>
                <span
                  className="client-meta"
                  style={{
                    fontSize: 11,
                    color: "#94A3B8",
                    fontVariantNumeric: "tabular-nums",
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ display: "block", color: "#CBD5E1", fontWeight: 600 }}>
                    {c.sessionCount} session{c.sessionCount !== 1 ? "s" : ""}
                  </span>
                  <span style={{ display: "block", marginTop: 2 }}>
                    {relativeDays(c.lastSessionAt)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {(query && filtered.length > 0) && (
        <p style={{ fontSize: 11, color: "#7A7268", marginTop: 12, textAlign: "right" }}>
          {filtered.length} of {clients.length}
        </p>
      )}

      <style>{`
        @media (max-width: 640px) {
          .client-meta { display: none; }
        }
      `}</style>
    </div>
  );
}
