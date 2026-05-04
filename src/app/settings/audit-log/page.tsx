import { auth } from "@/lib/auth/config"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { auditLogs, clinicians } from "@/lib/db/schema"
import { eq, desc, and, gte } from "drizzle-orm"
import { Shield } from "lucide-react"

// ── Types ────────────────────────────────────────────────────────────────────

interface LogEntry {
  id: string
  clinicianName: string | null
  action: string
  resourceType: string | null
  resourceLabel: string | null
  ipAddress: string | null
  createdAt: Date
}

// ── Demo data (shown when audit_logs table does not yet exist) ────────────────

const demoLogs: LogEntry[] = [
  { id: "1",  clinicianName: "Dr. Sarah Chen",   action: "client.viewed",     resourceType: "client",   resourceLabel: "John Martinez",      ipAddress: "192.168.1.45", createdAt: new Date(Date.now() - 3_600_000) },
  { id: "2",  clinicianName: "Dr. Sarah Chen",   action: "session.exported",  resourceType: "session",  resourceLabel: "Session #1234",       ipAddress: "192.168.1.45", createdAt: new Date(Date.now() - 7_200_000) },
  { id: "3",  clinicianName: "Dr. Marcus Webb",  action: "client.created",    resourceType: "client",   resourceLabel: "Emily Thompson",      ipAddress: "10.0.0.12",    createdAt: new Date(Date.now() - 10_800_000) },
  { id: "4",  clinicianName: "Dr. Sarah Chen",   action: "invoice.viewed",    resourceType: "invoice",  resourceLabel: "INV-2026-0041",       ipAddress: "192.168.1.45", createdAt: new Date(Date.now() - 18_000_000) },
  { id: "5",  clinicianName: "Dr. Marcus Webb",  action: "session.viewed",    resourceType: "session",  resourceLabel: "Session #1229",       ipAddress: "10.0.0.12",    createdAt: new Date(Date.now() - 86_400_000) },
  { id: "6",  clinicianName: "Dr. Sarah Chen",   action: "client.updated",    resourceType: "client",   resourceLabel: "Priya Nair",          ipAddress: "192.168.1.45", createdAt: new Date(Date.now() - 90_000_000) },
  { id: "7",  clinicianName: "Admin",            action: "admin.login",       resourceType: null,       resourceLabel: null,                  ipAddress: "203.0.113.5",  createdAt: new Date(Date.now() - 93_600_000) },
  { id: "8",  clinicianName: "Dr. Marcus Webb",  action: "client.viewed",     resourceType: "client",   resourceLabel: "Liam O'Brien",        ipAddress: "10.0.0.12",    createdAt: new Date(Date.now() - 172_800_000) },
  { id: "9",  clinicianName: "Dr. Sarah Chen",   action: "session.exported",  resourceType: "session",  resourceLabel: "Session #1220",       ipAddress: "192.168.1.45", createdAt: new Date(Date.now() - 180_000_000) },
  { id: "10", clinicianName: "Dr. Sarah Chen",   action: "invoice.sent",      resourceType: "invoice",  resourceLabel: "INV-2026-0038",       ipAddress: "192.168.1.45", createdAt: new Date(Date.now() - 259_200_000) },
  { id: "11", clinicianName: "Dr. Marcus Webb",  action: "client.created",    resourceType: "client",   resourceLabel: "Sofia Andersen",      ipAddress: "10.0.0.12",    createdAt: new Date(Date.now() - 345_600_000) },
  { id: "12", clinicianName: "Admin",            action: "admin.settings",    resourceType: null,       resourceLabel: null,                  ipAddress: "203.0.113.5",  createdAt: new Date(Date.now() - 432_000_000) },
  { id: "13", clinicianName: "Dr. Sarah Chen",   action: "client.viewed",     resourceType: "client",   resourceLabel: "Carlos Reyes",        ipAddress: "192.168.1.45", createdAt: new Date(Date.now() - 518_400_000) },
  { id: "14", clinicianName: "Dr. Marcus Webb",  action: "session.viewed",    resourceType: "session",  resourceLabel: "Session #1215",       ipAddress: "10.0.0.12",    createdAt: new Date(Date.now() - 518_800_000) },
  { id: "15", clinicianName: "Dr. Sarah Chen",   action: "invoice.viewed",    resourceType: "invoice",  resourceLabel: "INV-2026-0034",       ipAddress: "192.168.1.45", createdAt: new Date(Date.now() - 604_800_000) },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function actionLabel(action: string): string {
  const map: Record<string, string> = {
    "client.viewed":    "Viewed client",
    "client.created":   "Created client",
    "client.updated":   "Updated client",
    "client.deleted":   "Deleted client",
    "session.viewed":   "Viewed session",
    "session.exported": "Exported session",
    "session.created":  "Created session",
    "invoice.viewed":   "Viewed invoice",
    "invoice.sent":     "Sent invoice",
    "invoice.created":  "Created invoice",
    "protocol.created": "Created protocol",
    "protocol.updated": "Updated protocol",
    "admin.login":      "Admin login",
    "admin.settings":   "Changed settings",
  }
  return map[action] ?? action
}

function actionBadgeStyle(action: string): React.CSSProperties {
  if (action.startsWith("client."))   return { background: "color-mix(in srgb, var(--brand) 12%, transparent)",   color: "var(--brand)" }
  if (action.startsWith("session."))  return { background: "var(--success-subtle)",                               color: "var(--success)" }
  if (action.startsWith("invoice."))  return { background: "color-mix(in srgb, var(--warning) 12%, transparent)", color: "var(--warning)" }
  if (action.startsWith("admin."))    return { background: "var(--danger-subtle)",                                color: "var(--danger)" }
  return { background: "var(--surface-sunken)", color: "var(--text-secondary)" }
}

function fmtDatetime(d: Date): string {
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true,
  })
}

function dayKey(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
}

function groupByDay(logs: LogEntry[]): Map<string, LogEntry[]> {
  const map = new Map<string, LogEntry[]>()
  for (const log of logs) {
    const key = dayKey(new Date(log.createdAt))
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(log)
  }
  return map
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function AuditLogPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const userRole = (session.user as { role?: string }).role
  const clinicId = (session.user as { clinicId?: string }).clinicId ?? ""

  if (userRole !== "admin") {
    return (
      <div
        className="max-w-2xl mx-auto mt-16 rounded-xl border p-10 text-center"
        style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}
      >
        <Shield size={36} style={{ color: "var(--danger)", margin: "0 auto 16px" }} />
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
          Access Restricted
        </h2>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          The audit log is accessible to administrators only. Contact your clinic admin if you require access.
        </p>
      </div>
    )
  }

  // ── Fetch logs (with graceful fallback if table not yet migrated) ───────────

  let logs: LogEntry[] = []
  let isDemo = false

  try {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000)

    logs = await db
      .select({
        id: auditLogs.id,
        clinicianName: auditLogs.clinicianName,
        action: auditLogs.action,
        resourceType: auditLogs.resourceType,
        resourceLabel: auditLogs.resourceLabel,
        ipAddress: auditLogs.ipAddress,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .where(eq(auditLogs.clinicId, clinicId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(200)
  } catch {
    logs = demoLogs
    isDemo = true
  }

  // ── Stats ────────────────────────────────────────────────────────────────────

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const todayLogs = logs.filter(l => new Date(l.createdAt) >= todayStart)
  const totalToday = todayLogs.length
  const uniqueUsersToday = new Set(todayLogs.map(l => l.clinicianName)).size
  const exportsToday = todayLogs.filter(l => l.action.includes("exported")).length

  const grouped = groupByDay(logs)

  // ── Render ───────────────────────────────────────────────────────────────────

  const card = "rounded-xl border p-5 mb-5"
  const cardSt: React.CSSProperties = { background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Shield size={22} style={{ color: "var(--brand)" }} />
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Audit Log</h1>
      </div>
      <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
        All PHI access and administrative actions are recorded.
      </p>

      {isDemo && (
        <div
          className="rounded-lg border px-4 py-3 mb-6 text-sm"
          style={{ background: "color-mix(in srgb, var(--warning) 10%, transparent)", borderColor: "color-mix(in srgb, var(--warning) 30%, transparent)", color: "var(--warning)" }}
        >
          Demo data shown — run <code className="font-mono text-xs px-1 rounded" style={{ background: "color-mix(in srgb, var(--warning) 15%, transparent)" }}>npx drizzle-kit push</code> to create the <code className="font-mono text-xs">audit_logs</code> table.
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Events today",       value: totalToday },
          { label: "Unique users today", value: uniqueUsersToday },
          { label: "Exports today",      value: exportsToday },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border px-5 py-4" style={cardSt}>
            <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-1 rounded-lg border overflow-hidden text-sm" style={{ borderColor: "var(--border-default)", background: "var(--surface-raised)" }}>
          {["Last 24h", "Last 7 days", "Last 30 days", "All time"].map((label, i) => (
            <button
              key={label}
              disabled
              className="px-3 py-1.5 text-xs font-medium"
              style={i === 3 ? { background: "color-mix(in srgb, var(--brand) 10%, transparent)", color: "var(--brand)" } : { color: "var(--text-secondary)" }}
            >
              {label}
            </button>
          ))}
        </div>

        <select
          disabled
          className="rounded-lg border px-3 py-1.5 text-xs"
          style={{ borderColor: "var(--border-default)", background: "var(--surface-raised)", color: "var(--text-secondary)" }}
        >
          <option>All action types</option>
          <option>client.*</option>
          <option>session.*</option>
          <option>invoice.*</option>
          <option>admin.*</option>
        </select>

        <select
          disabled
          className="rounded-lg border px-3 py-1.5 text-xs"
          style={{ borderColor: "var(--border-default)", background: "var(--surface-raised)", color: "var(--text-secondary)" }}
        >
          <option>All clinicians</option>
        </select>

        <p className="text-xs ml-auto" style={{ color: "var(--text-tertiary)" }}>
          Filters coming in a future release
        </p>
      </div>

      {/* Log table */}
      {logs.length === 0 ? (
        <div
          className="rounded-xl border border-dashed py-16 text-center text-sm"
          style={{ borderColor: "var(--border-default)", color: "var(--text-tertiary)" }}
        >
          No audit events recorded yet.
        </div>
      ) : (
        <div className={card} style={{ ...cardSt, padding: 0, overflow: "hidden" }}>
          {Array.from(grouped.entries()).map(([day, dayLogs]) => (
            <div key={day}>
              {/* Day separator */}
              <div
                className="px-6 py-2 text-xs font-semibold uppercase tracking-wider border-b"
                style={{ background: "var(--surface-sunken)", borderColor: "var(--border-subtle)", color: "var(--text-tertiary)" }}
              >
                {day}
              </div>

              <table className="w-full text-sm">
                <colgroup>
                  <col style={{ width: "160px" }} />
                  <col style={{ width: "160px" }} />
                  <col style={{ width: "160px" }} />
                  <col />
                  <col style={{ width: "130px" }} />
                </colgroup>
                <thead className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
                  <tr>
                    {["Timestamp", "Clinician", "Action", "Resource", "IP Address"].map(h => (
                      <th
                        key={h}
                        className="text-left px-6 py-2 text-xs font-medium"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                  {dayLogs.map(log => (
                    <tr key={log.id}>
                      <td className="px-6 py-3 text-xs whitespace-nowrap" style={{ color: "var(--text-tertiary)" }}>
                        {fmtDatetime(new Date(log.createdAt))}
                      </td>
                      <td className="px-6 py-3 text-xs" style={{ color: "var(--text-secondary)" }}>
                        {log.clinicianName ?? <span style={{ color: "var(--text-tertiary)" }}>—</span>}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
                          style={actionBadgeStyle(log.action)}
                        >
                          {actionLabel(log.action)}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs" style={{ color: "var(--text-secondary)" }}>
                        {log.resourceLabel
                          ? (
                            <span>
                              <span className="font-medium" style={{ color: "var(--text-primary)" }}>{log.resourceLabel}</span>
                              {log.resourceType && (
                                <span className="ml-1.5" style={{ color: "var(--text-tertiary)" }}>({log.resourceType})</span>
                              )}
                            </span>
                          )
                          : <span style={{ color: "var(--text-tertiary)" }}>—</span>
                        }
                      </td>
                      <td className="px-6 py-3 text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
                        {log.ipAddress ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Export + HIPAA note */}
      <div className="flex items-center justify-between mt-4 gap-4 flex-wrap">
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          This log is maintained for HIPAA compliance. Records are retained for 7 years.
        </p>
        <a
          href="/api/audit/export"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors"
          style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)", background: "var(--surface-raised)" }}
        >
          Export Audit Log
        </a>
      </div>
    </div>
  )
}
