/**
 * Client portal landing — hub for everything a client can do with their
 * personal token: daily check-in, view/book schedule, do home practice.
 *
 * The token is opaque and lives on clients.checkInToken. Anyone who has
 * the URL can act as the client (no password), but the token is only
 * shared by the clinician via a private channel.
 */

import Link from "next/link";
import { db } from "@/lib/db";
import { clients, clinics, checkIns } from "@/lib/db/schema";
import { eq, desc, and, gte } from "drizzle-orm";

export default async function ClientPortalLandingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Look up client by their public check-in token. Bail with a friendly
  // notice if the token is unknown or has been revoked.
  const [client] = await db
    .select({
      id: clients.id,
      name: clients.name,
      clinicId: clients.clinicId,
    })
    .from(clients)
    .where(eq(clients.checkInToken, token))
    .limit(1);

  if (!client) {
    return (
      <PortalShell>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔗</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>
          Invalid link
        </h1>
        <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.5 }}>
          This portal link is invalid or has been revoked. Please ask your clinician for a fresh
          link.
        </p>
      </PortalShell>
    );
  }

  // Clinic name for the header — best-effort, falls back to a generic label.
  const [clinic] = await db
    .select({ name: clinics.name })
    .from(clinics)
    .where(eq(clinics.id, client.clinicId))
    .limit(1);

  // Last 14-day check-in streak data so the client sees their consistency.
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const recentCheckIns = await db
    .select({ date: checkIns.date })
    .from(checkIns)
    .where(and(eq(checkIns.clientId, client.id), gte(checkIns.date, fourteenDaysAgo)))
    .orderBy(desc(checkIns.date));

  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const hasCheckedInToday = recentCheckIns.some(
    (c) => c.date.toISOString().slice(0, 10) === todayKey
  );

  // Compute consecutive-day streak ending today (or yesterday if not done
  // yet today). Walk back day-by-day looking for any check-in row.
  const daySet = new Set(recentCheckIns.map((c) => c.date.toISOString().slice(0, 10)));
  let streak = 0;
  const cursor = new Date(today);
  if (!daySet.has(todayKey)) cursor.setDate(cursor.getDate() - 1); // grace for "today not done yet"
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (!daySet.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
    if (streak > 14) break;
  }

  const firstName = client.name.split(/\s+/)[0] || client.name;

  return (
    <PortalShell wide>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#94A3B8",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 6,
          }}
        >
          {clinic?.name ?? "Your clinic"} · client portal
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0F172A", margin: 0, letterSpacing: "-0.02em" }}>
          Hi, {firstName}.
        </h1>
        <p style={{ fontSize: 14, color: "#475569", marginTop: 6, lineHeight: 1.5 }}>
          This is your private portal. Use the cards below to check in, manage your appointments,
          or work through home-practice exercises.
        </p>
      </div>

      {/* Streak banner */}
      <div
        style={{
          background: hasCheckedInToday ? "#ECFDF5" : "#F0F9FF",
          border: `1px solid ${hasCheckedInToday ? "#A7F3D0" : "#BAE6FD"}`,
          borderRadius: 12,
          padding: "14px 18px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 24 }}>{hasCheckedInToday ? "✓" : "🌅"}</span>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: hasCheckedInToday ? "#065F46" : "#0C4A6E" }}>
            {hasCheckedInToday
              ? "You've checked in today — nice."
              : "Today's check-in is still open."}
          </div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
            {streak === 0
              ? "Start a streak by checking in below."
              : `${streak} day${streak === 1 ? "" : "s"} in a row.`}
          </div>
        </div>
      </div>

      {/* Action cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
        }}
      >
        <PortalCard
          href={`/checkin/${token}`}
          emoji="📝"
          title={hasCheckedInToday ? "Update today's check-in" : "Do today's check-in"}
          blurb="Quick 30-second self-report on sleep, mood, anxiety, focus, and energy. Sent straight to your clinician."
          cta={hasCheckedInToday ? "Edit answers" : "Start check-in"}
          primary={!hasCheckedInToday}
        />
        <PortalCard
          href={`/portal/${token}/schedule`}
          emoji="📅"
          title="My schedule"
          blurb="See upcoming appointments and book your next session at a time that works."
          cta="View schedule"
        />
        <PortalCard
          href={`/portal/${token}/practice`}
          emoji="🧘"
          title="Home practice"
          blurb="Breathing exercises, mini-trainings, and reminders your clinician has assigned."
          cta="Open practice"
        />
      </div>

      {/* Privacy notice */}
      <p
        style={{
          fontSize: 11,
          color: "#94A3B8",
          marginTop: 28,
          paddingTop: 16,
          borderTop: "1px solid #E2E8F0",
          lineHeight: 1.5,
        }}
      >
        Anyone with this link can submit a check-in or book on your behalf — treat it like a
        password. Ask your clinician to revoke it if you suspect it's been shared.
      </p>
    </PortalShell>
  );
}

// ── presentational helpers ─────────────────────────────────────────────────

function PortalShell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        background: "#F8FAFC",
        padding: "32px 24px",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 16,
          padding: wide ? "32px 28px" : "48px 40px",
          maxWidth: wide ? 720 : 420,
          width: "100%",
          textAlign: wide ? "left" : "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function PortalCard({
  href,
  emoji,
  title,
  blurb,
  cta,
  primary = false,
}: {
  href: string;
  emoji: string;
  title: string;
  blurb: string;
  cta: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: 18,
        background: primary ? "#EFF6FF" : "white",
        border: `1px solid ${primary ? "#BFDBFE" : "#E2E8F0"}`,
        borderRadius: 12,
        textDecoration: "none",
        color: "inherit",
        transition: "border-color 0.15s, box-shadow 0.15s",
        minHeight: 150,
      }}
    >
      <span style={{ fontSize: 24 }}>{emoji}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{title}</span>
      <span style={{ fontSize: 12, color: "#64748B", lineHeight: 1.45, flex: 1 }}>{blurb}</span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: primary ? "#2563EB" : "#475569",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginTop: 4,
        }}
      >
        {cta} →
      </span>
    </Link>
  );
}
