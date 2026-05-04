import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clients, messages } from "@/lib/db/schema";
import { eq, and, desc, isNull, count, max } from "drizzle-orm";
import Link from "next/link";
import { MessageSquare, Circle } from "lucide-react";

export default async function MessagesHubPage() {
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";

  // Get all active clients with message activity
  const clientRows = await db
    .select({
      id: clients.id,
      name: clients.name,
      email: clients.email,
      lastMessageAt: max(messages.createdAt),
      totalMessages: count(messages.id),
      unreadCount: count(
        and(eq(messages.senderRole, "client"), isNull(messages.readAt))
      ),
    })
    .from(clients)
    .leftJoin(messages, eq(messages.clientId, clients.id))
    .where(and(eq(clients.clinicId, clinicId), eq(clients.active, true)))
    .groupBy(clients.id)
    .orderBy(desc(max(messages.createdAt)));

  const totalUnread = clientRows.reduce((s, r) => s + Number(r.unreadCount ?? 0), 0);
  const withMessages = clientRows.filter((r) => Number(r.totalMessages) > 0);
  const noMessages   = clientRows.filter((r) => Number(r.totalMessages) === 0);

  function initials(name: string) {
    return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  }

  function avatarColor(name: string) {
    const colors = [
      ["#dbeafe", "#2563eb"], ["#dcfce7", "#16a34a"], ["#fef3c7", "#d97706"],
      ["#fce7f3", "#db2777"], ["#ede9fe", "#7c3aed"], ["#ffedd5", "#ea580c"],
    ];
    const idx = name.charCodeAt(0) % colors.length;
    return colors[idx];
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Messages
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            {withMessages.length} conversation{withMessages.length !== 1 ? "s" : ""}
            {totalUnread > 0 && (
              <span className="ml-1.5 status-pill status-pill-danger">
                {totalUnread} unread
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Conversations */}
      {withMessages.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <MessageSquare size={22} />
            </div>
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>No messages yet</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
              Messages appear here when you or your clients send them.
            </p>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div
            className="px-5 py-3.5"
            style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--surface-sunken)" }}
          >
            <p className="text-xs font-semibold" style={{ color: "var(--text-tertiary)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Active Conversations
            </p>
          </div>
          <div>
            {withMessages.map((client, i) => {
              const unread = Number(client.unreadCount ?? 0);
              const [bgColor, textColor] = avatarColor(client.name);
              const lastMsgAgo = client.lastMessageAt
                ? (() => {
                    const diff = Date.now() - new Date(client.lastMessageAt).getTime();
                    const mins = Math.floor(diff / 60000);
                    if (mins < 60) return `${mins}m ago`;
                    const hrs = Math.floor(mins / 60);
                    if (hrs < 24) return `${hrs}h ago`;
                    return `${Math.floor(hrs / 24)}d ago`;
                  })()
                : null;

              return (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}/messages`}
                  className="flex items-center gap-4 px-5 py-4 transition-colors"
                  style={{
                    borderTop: i > 0 ? "1px solid var(--border-subtle)" : undefined,
                    background: unread > 0 ? "var(--brand-subtle)" : "transparent",
                  }}
                >
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                    style={{ background: bgColor, color: textColor }}
                  >
                    {initials(client.name)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                        {client.name}
                      </span>
                      {unread > 0 && (
                        <span
                          className="min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full flex items-center justify-center shrink-0"
                          style={{ background: "var(--brand)", color: "white" }}
                        >
                          {unread}
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-tertiary)" }}>
                      {client.email ?? "No email"} · {client.totalMessages} message{Number(client.totalMessages) !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Time + arrow */}
                  <div className="flex items-center gap-2 shrink-0">
                    {lastMsgAgo && (
                      <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{lastMsgAgo}</span>
                    )}
                    {unread > 0 && (
                      <Circle size={8} style={{ fill: "var(--brand)", color: "var(--brand)" }} />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Clients with no messages */}
      {noMessages.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-tertiary)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            No Messages Yet
          </p>
          <div className="card overflow-hidden">
            {noMessages.slice(0, 8).map((client, i) => {
              const [bgColor, textColor] = avatarColor(client.name);
              return (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}/messages`}
                  className="flex items-center gap-3 px-5 py-3 transition-colors"
                  style={{ borderTop: i > 0 ? "1px solid var(--border-subtle)" : undefined }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                    style={{ background: bgColor, color: textColor }}
                  >
                    {initials(client.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{client.name}</p>
                    {client.email && <p className="text-xs truncate" style={{ color: "var(--text-tertiary)" }}>{client.email}</p>}
                  </div>
                  <span className="text-xs" style={{ color: "var(--brand)" }}>Start chat →</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
