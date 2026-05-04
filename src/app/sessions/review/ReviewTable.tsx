"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { markSessionReviewed } from "./actions";

type SessionRow = {
  id: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  avgRewardScore: number | null;
  deviceType: string;
  clientId: string;
  clientName: string;
};

type FilterTab = "all" | "high-priority" | "recent";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getDaysSince(isoString: string): number {
  const ms = Date.now() - new Date(isoString).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const DEVICE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  mendi: { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" },
  muse: { bg: "#F5F3FF", color: "#6D28D9", border: "#DDD6FE" },
  simulator: { bg: "#F0FDF4", color: "#166534", border: "#BBF7D0" },
};

function DeviceBadge({ device }: { device: string }) {
  const style = DEVICE_COLORS[device.toLowerCase()] ?? {
    bg: "#F8FAFC",
    color: "#475569",
    border: "#E2E8F0",
  };
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: 99,
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        textTransform: "capitalize" as const,
        letterSpacing: "0.02em",
      }}
    >
      {device}
    </span>
  );
}

function DaysBadge({ days }: { days: number }) {
  const isUrgent = days >= 7;
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: 99,
        background: isUrgent ? "#FEF2F2" : "#FEF9EE",
        color: isUrgent ? "#DC2626" : "#92400E",
        border: `1px solid ${isUrgent ? "#FECACA" : "#FDE68A"}`,
      }}
    >
      {days === 0 ? "Today" : `${days}d ago`}
    </span>
  );
}

export function ReviewTable({ sessions }: { sessions: SessionRow[] }) {
  const [filter, setFilter] = useState<FilterTab>("all");
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = sessions.filter((s) => {
    if (reviewed.has(s.id)) return false;
    const days = getDaysSince(s.startedAt);
    if (filter === "high-priority") return days >= 7;
    if (filter === "recent") return new Date(s.startedAt) >= today;
    return true;
  });

  const allCount = sessions.filter((s) => !reviewed.has(s.id)).length;
  const highPriorityCount = sessions.filter((s) => !reviewed.has(s.id) && getDaysSince(s.startedAt) >= 7).length;
  const recentCount = sessions.filter((s) => !reviewed.has(s.id) && new Date(s.startedAt) >= today).length;

  function handleMarkReviewed(sessionId: string) {
    setPendingId(sessionId);
    startTransition(async () => {
      const res = await markSessionReviewed(sessionId);
      if (res.success) {
        setReviewed((prev) => new Set([...prev, sessionId]));
      }
      setPendingId(null);
    });
  }

  const TABS: { id: FilterTab; label: string; count: number }[] = [
    { id: "all", label: "All Pending", count: allCount },
    { id: "high-priority", label: "High Priority (7+ days)", count: highPriorityCount },
    { id: "recent", label: "Recent (today)", count: recentCount },
  ];

  return (
    <div>
      {/* Summary bar */}
      <div
        style={{
          background: "var(--surface-raised)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          padding: "12px 16px",
          display: "flex",
          gap: 24,
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {allCount} session{allCount !== 1 ? "s" : ""} pending review
        </span>
        <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          Average completion time: ~8 min
        </span>
        {highPriorityCount > 0 && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              padding: "2px 10px",
              borderRadius: 99,
              background: "#FEF2F2",
              color: "#DC2626",
              border: "1px solid #FECACA",
            }}
          >
            {highPriorityCount} overdue
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            style={{
              padding: "7px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              border: "1px solid",
              cursor: "pointer",
              transition: "all 0.1s",
              borderColor: filter === tab.id ? "var(--brand)" : "var(--border-default)",
              background: filter === tab.id ? "var(--brand)" : "var(--surface-raised)",
              color: filter === tab.id ? "white" : "var(--text-secondary)",
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                style={{
                  marginLeft: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: 99,
                  background: filter === tab.id ? "rgba(255,255,255,0.25)" : "var(--surface-sunken)",
                  color: filter === tab.id ? "white" : "var(--text-tertiary)",
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            background: "var(--surface-raised)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "40px",
            textAlign: "center",
            color: "var(--text-tertiary)",
            fontSize: 14,
          }}
        >
          No sessions match this filter.
        </div>
      ) : (
        <div
          style={{
            background: "var(--surface-raised)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1fr 2fr",
              gap: 12,
              padding: "10px 16px",
              borderBottom: "1px solid var(--border-subtle)",
              background: "var(--surface-sunken)",
            }}
          >
            {["Client", "Date", "Duration", "Avg Reward", "Device", "Age", "Actions"].map((h) => (
              <div
                key={h}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.06em",
                  color: "var(--text-tertiary)",
                }}
              >
                {h}
              </div>
            ))}
          </div>

          {/* Table rows */}
          {filtered.map((s) => {
            const days = getDaysSince(s.startedAt);
            const isMarkingThis = pendingId === s.id && isPending;

            return (
              <div
                key={s.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1fr 2fr",
                  gap: 12,
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border-subtle)",
                  alignItems: "center",
                  transition: "background 0.1s",
                }}
              >
                {/* Client */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "var(--brand)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "white",
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(s.clientName)}
                  </div>
                  <Link
                    href={`/clients/${s.clientId}`}
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--brand)",
                      textDecoration: "none",
                    }}
                  >
                    {s.clientName}
                  </Link>
                </div>

                {/* Date */}
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  {formatDate(s.startedAt)}
                </div>

                {/* Duration */}
                <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>
                  {formatDuration(s.durationSeconds)}
                </div>

                {/* Avg reward */}
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color:
                      s.avgRewardScore == null
                        ? "var(--text-tertiary)"
                        : s.avgRewardScore >= 70
                        ? "var(--success)"
                        : s.avgRewardScore >= 40
                        ? "var(--warning)"
                        : "var(--danger)",
                  }}
                >
                  {s.avgRewardScore != null ? `${s.avgRewardScore.toFixed(1)}%` : "—"}
                </div>

                {/* Device */}
                <div>
                  <DeviceBadge device={s.deviceType} />
                </div>

                {/* Days since */}
                <div>
                  <DaysBadge days={days} />
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Link
                    href={`/sessions/${s.id}/soap`}
                    style={{
                      padding: "6px 12px",
                      background: "var(--brand)",
                      color: "white",
                      borderRadius: 7,
                      fontSize: 12,
                      fontWeight: 600,
                      textDecoration: "none",
                      whiteSpace: "nowrap" as const,
                    }}
                  >
                    Write SOAP Note
                  </Link>
                  <button
                    onClick={() => handleMarkReviewed(s.id)}
                    disabled={isMarkingThis}
                    style={{
                      padding: "6px 10px",
                      background: "var(--surface-sunken)",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border-default)",
                      borderRadius: 7,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: isMarkingThis ? "not-allowed" : "pointer",
                      opacity: isMarkingThis ? 0.6 : 1,
                      whiteSpace: "nowrap" as const,
                    }}
                  >
                    {isMarkingThis ? "..." : "Mark Reviewed"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
